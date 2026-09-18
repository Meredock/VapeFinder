const express = require('express');
const path = require('path');
const { getStores, ZIP_COORDINATES } = require('./data/storeRepository');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const CUSTOM_VAPE_OPTIONS = {
  devices: [
    { value: 'pod', label: 'Pod System', price: 24 },
    { value: 'pen', label: 'Pen Kit', price: 32 },
    { value: 'box', label: 'Box Mod', price: 48 },
    { value: 'disposable', label: 'Disposable', price: 18 },
  ],
  flavors: [
    { value: 'blueberry', label: 'Blueberry Burst', price: 8 },
    { value: 'mango', label: 'Mango Ice', price: 8 },
    { value: 'strawberry', label: 'Strawberry Cream', price: 8 },
    { value: 'mint', label: 'Mint Slush', price: 7 },
    { value: 'grape', label: 'Grape Soda', price: 8 },
  ],
  nicotine: [
    { value: '0mg', label: '0mg', price: 0 },
    { value: '3mg', label: '3mg', price: 0 },
    { value: '6mg', label: '6mg', price: 0 },
    { value: '20mg', label: '20mg', price: 0 },
  ],
  battery: [
    { value: '650mAh', label: '650mAh', price: 5 },
    { value: '950mAh', label: '950mAh', price: 8 },
    { value: '1500mAh', label: '1500mAh', price: 12 },
  ],
  coil: [
    { value: 'mesh', label: 'Mesh Coil', price: 6 },
    { value: 'dual', label: 'Dual Coil', price: 9 },
    { value: 'ceramic', label: 'Ceramic Core', price: 7 },
  ],
  airflow: [
    { value: 'tight', label: 'Tight Draw', price: 0 },
    { value: 'balanced', label: 'Balanced', price: 0 },
    { value: 'loose', label: 'Loose Draw', price: 0 },
  ],
  colors: [
    { value: 'midnight', label: 'Midnight', price: 0 },
    { value: 'slate', label: 'Slate Gray', price: 0 },
    { value: 'crimson', label: 'Crimson Red', price: 0 },
    { value: 'sage', label: 'Sage Green', price: 0 },
  ],
  extras: [
    { value: 'none', label: 'No extra', price: 0 },
    { value: 'travel-case', label: 'Travel Case', price: 18 },
    { value: 'usb-cable', label: 'USB-C Cable', price: 12 },
    { value: 'spare-coils', label: 'Spare Coils', price: 16 },
  ],
};

app.set('trust proxy', true);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((earthRadiusMiles * c).toFixed(1));
}

function getOriginCoordinates({ zip, latitude, longitude }) {
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { latitude, longitude };
  }

  if (zip) {
    const normalizedZip = String(zip).trim();
    if (ZIP_COORDINATES[normalizedZip]) {
      return ZIP_COORDINATES[normalizedZip];
    }
  }

  return null;
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
  }
  return false;
}

function getOptionByValue(options, value, fallbackValue) {
  const list = Array.isArray(options) ? options : [];
  return list.find((item) => item.value === value) || list.find((item) => item.value === fallbackValue) || list[0];
}

function buildCustomVape(selection = {}) {
  const device = getOptionByValue(CUSTOM_VAPE_OPTIONS.devices, selection.device, 'pod');
  const flavor = getOptionByValue(CUSTOM_VAPE_OPTIONS.flavors, selection.flavor, 'blueberry');
  const nicotine = getOptionByValue(CUSTOM_VAPE_OPTIONS.nicotine, selection.nicotine, '3mg');
  const battery = getOptionByValue(CUSTOM_VAPE_OPTIONS.battery, selection.battery, '950mAh');
  const coil = getOptionByValue(CUSTOM_VAPE_OPTIONS.coil, selection.coil, 'mesh');
  const airflow = getOptionByValue(CUSTOM_VAPE_OPTIONS.airflow, selection.airflow, 'balanced');
  const color = getOptionByValue(CUSTOM_VAPE_OPTIONS.colors, selection.color, 'midnight');
  const extra = getOptionByValue(CUSTOM_VAPE_OPTIONS.extras, selection.extra, 'none');

  const price = [device, flavor, battery, coil, extra].reduce((total, item) => {
    return total + Number(item.price || 0);
  }, 0);

  const summary = `${flavor.label} ${device.label} with ${nicotine.label} nicotine, ${battery.label} battery, ${airflow.label}, ${color.label} finish${extra.value === 'none' ? '' : ` + ${extra.label}`}.`;

  return {
    device,
    flavor,
    nicotine,
    battery,
    coil,
    airflow,
    color,
    extra,
    price: Number(price.toFixed(2)),
    summary,
  };
}

function getVapeBuilderOptions() {
  return JSON.parse(JSON.stringify(CUSTOM_VAPE_OPTIONS));
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'vape-finder',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/custom-vape/options', (req, res) => {
  res.json({
    options: getVapeBuilderOptions(),
  });
});

app.post('/api/custom-vape/build', (req, res) => {
  const result = buildCustomVape(req.body || {});

  res.json({
    success: true,
    result,
  });
});

app.get('/api/stores', (req, res) => {
  const query = String(req.query.query || '').trim();
  const city = String(req.query.city || '').trim();
  const state = String(req.query.state || '').trim();
  const zip = String(req.query.zip || '').trim();
  const product = String(req.query.product || '').trim();
  const distanceLimit = Number(req.query.distance || 0);
  const deliveryOnly = parseBoolean(req.query.deliveryOnly || false);
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lng);

  let results = getStores().filter((store) => {
    const searchableText = [
      store.name,
      store.city,
      store.state,
      store.zip,
      store.address,
      store.phone,
      ...store.products,
    ]
      .join(' ')
      .toLowerCase();

    if (query && !searchableText.includes(query.toLowerCase())) {
      return false;
    }

    if (city && store.city.toLowerCase() !== city.toLowerCase()) {
      return false;
    }

    if (state && store.state.toLowerCase() !== state.toLowerCase()) {
      return false;
    }

    if (zip && store.zip !== zip) {
      return false;
    }

    if (product && !store.products.some((item) => item.toLowerCase().includes(product.toLowerCase()))) {
      return false;
    }

    if (deliveryOnly && !store.delivery) {
      return false;
    }

    return true;
  });

  const origin = getOriginCoordinates({ zip, latitude, longitude });

  if (origin) {
    results = results.map((store) => {
      const hasCoordinates = Number.isFinite(store.latitude) && Number.isFinite(store.longitude);
      const distanceMiles = hasCoordinates
        ? haversineMiles(origin.latitude, origin.longitude, store.latitude, store.longitude)
        : null;

      return { ...store, distanceMiles };
    });

    results = results.filter((store) => {
      if (distanceLimit > 0 && store.distanceMiles !== null) {
        return store.distanceMiles <= distanceLimit;
      }
      return true;
    });

    results.sort((a, b) => {
      if (a.distanceMiles === null && b.distanceMiles === null) return 0;
      if (a.distanceMiles === null) return 1;
      if (b.distanceMiles === null) return -1;
      return a.distanceMiles - b.distanceMiles;
    });
  }

  const formatted = results.map((store) => ({
    ...store,
    websiteHost: new URL(store.website).hostname,
    distanceMiles: store.distanceMiles ?? null,
  }));

  res.json({
    total: formatted.length,
    results: formatted,
    origin,
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Vape finder app is running on http://localhost:${PORT}`);
  });
}

module.exports = {
  app,
  buildCustomVape,
  getVapeBuilderOptions,
};
