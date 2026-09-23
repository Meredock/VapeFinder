const express = require('express');
const path = require('path');
const { getStores, ZIP_COORDINATES } = require('./data/storeRepository');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const CUSTOM_VAPE_OPTIONS = {
  devices: [
    { value: 'pod', label: 'Pod System', price: 24, wattage: 18, cloudBonus: 0.4, efficiencyBonus: 0.4 },
    { value: 'pen', label: 'Pen Kit', price: 32, wattage: 22, cloudBonus: 0.7, efficiencyBonus: 0.2 },
    { value: 'box', label: 'Box Mod', price: 48, wattage: 30, cloudBonus: 1.2, efficiencyBonus: 0.1 },
    { value: 'disposable', label: 'Disposable', price: 18, wattage: 16, cloudBonus: 0.2, efficiencyBonus: 0.5 },
  ],
  chassis: [
    { value: 'aero', label: 'Aero Shell', price: 14, length: 90, width: 19, height: 118, airflowBonus: 6 },
    { value: 'slim', label: 'Slim Frame', price: 11, length: 82, width: 17, height: 110, airflowBonus: 2 },
    { value: 'max', label: 'Max Core', price: 18, length: 102, width: 22, height: 126, airflowBonus: 8 },
  ],
  tanks: [
    { value: 'mini', label: 'Mini Reservoir', price: 8, capacity: 3.5, lengthBoost: 4, wattageBoost: 2 },
    { value: 'pro', label: 'Pro Reservoir', price: 14, capacity: 7.6, lengthBoost: 12, wattageBoost: 4 },
    { value: 'xl', label: 'XL Tank', price: 20, capacity: 10.4, lengthBoost: 18, wattageBoost: 6 },
  ],
  finishes: [
    { value: 'obsidian', label: 'Obsidian Black', price: 0, tone: '#0f172a' },
    { value: 'slate', label: 'Satin Slate', price: 0, tone: '#475569' },
    { value: 'crimson', label: 'Crimson Red', price: 0, tone: '#dc2626' },
    { value: 'sage', label: 'Sage Green', price: 0, tone: '#16a34a' },
    { value: 'ice', label: 'Ice Silver', price: 0, tone: '#cbd5e1' },
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
    { value: '650mAh', label: '650mAh', price: 5, powerBoost: 0, lifeHours: 1.1, heightBoost: 4 },
    { value: '950mAh', label: '950mAh', price: 8, powerBoost: 2, lifeHours: 1.5, heightBoost: 10 },
    { value: '1500mAh', label: '1500mAh', price: 12, powerBoost: 4, lifeHours: 2.2, heightBoost: 16 },
  ],
  coil: [
    { value: 'mesh', label: 'Mesh Coil', price: 6, powerBoost: 2 },
    { value: 'dual', label: 'Dual Coil', price: 9, powerBoost: 5 },
    { value: 'ceramic', label: 'Ceramic Core', price: 7, powerBoost: 3 },
  ],
  airflow: [
    { value: 'tight', label: 'Tight Draw', price: 0, score: 70, widthBoost: 0.2, wattageBoost: 1 },
    { value: 'balanced', label: 'Balanced', price: 0, score: 83, widthBoost: 0.8, wattageBoost: 2 },
    { value: 'loose', label: 'Loose Draw', price: 0, score: 92, widthBoost: 1.6, wattageBoost: 3 },
  ],
  colors: [
    { value: 'midnight', label: 'Midnight', price: 0 },
    { value: 'slate', label: 'Slate Gray', price: 0 },
    { value: 'crimson', label: 'Crimson Red', price: 0 },
    { value: 'sage', label: 'Sage Green', price: 0 },
  ],
  accessories: [
    { value: 'none', label: 'No accessory', price: 0 },
    { value: 'travel-case', label: 'Travel Case', price: 18 },
    { value: 'usb-cable', label: 'USB-C Cable', price: 12 },
    { value: 'spare-coils', label: 'Spare Coils', price: 16 },
  ],
  extras: [
    { value: 'none', label: 'No extra', price: 0 },
    { value: 'travel-case', label: 'Travel Case', price: 18 },
    { value: 'usb-cable', label: 'USB-C Cable', price: 12 },
    { value: 'spare-coils', label: 'Spare Coils', price: 16 },
  ],
  profiles: [
    { value: 'balanced', label: 'Balanced', note: 'Smooth everyday draw', powerBias: 0 },
    { value: 'cloud', label: 'Cloud', note: 'Big hit, big vapor', powerBias: 8 },
    { value: 'efficiency', label: 'Efficiency', note: 'Long battery and lower heat', powerBias: -4 },
    { value: 'precision', label: 'Precision', note: 'Tighter control and crisp flavor', powerBias: 2 },
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
  const chassis = getOptionByValue(CUSTOM_VAPE_OPTIONS.chassis, selection.chassis, 'aero');
  const tank = getOptionByValue(CUSTOM_VAPE_OPTIONS.tanks, selection.tank, 'pro');
  const flavor = getOptionByValue(CUSTOM_VAPE_OPTIONS.flavors, selection.flavor, 'blueberry');
  const nicotine = getOptionByValue(CUSTOM_VAPE_OPTIONS.nicotine, selection.nicotine, '3mg');
  const battery = getOptionByValue(CUSTOM_VAPE_OPTIONS.battery, selection.battery, '950mAh');
  const coil = getOptionByValue(CUSTOM_VAPE_OPTIONS.coil, selection.coil, 'mesh');
  const airflow = getOptionByValue(CUSTOM_VAPE_OPTIONS.airflow, selection.airflow, 'balanced');
  const color = getOptionByValue(CUSTOM_VAPE_OPTIONS.colors, selection.color, 'midnight');
  const finish = getOptionByValue(CUSTOM_VAPE_OPTIONS.finishes, selection.finish || selection.color, 'obsidian');
  const accessory = getOptionByValue(CUSTOM_VAPE_OPTIONS.accessories, selection.accessory || selection.extra, 'none');
  const extra = getOptionByValue(CUSTOM_VAPE_OPTIONS.extras, selection.extra || selection.accessory, 'none');
  const profile = getOptionByValue(CUSTOM_VAPE_OPTIONS.profiles, selection.profile, 'balanced');

  const outputOverride = Number.isFinite(Number(selection.output)) ? Number(selection.output) : null;
  const sizeBias = Number.isFinite(Number(selection.sizeBias)) ? Number(selection.sizeBias) : 0;
  const airflowBias = Number.isFinite(Number(selection.airflowBias)) ? Number(selection.airflowBias) : 0;

  const bodyLength = Number((chassis.length || 90) + (tank.lengthBoost || 0) + (sizeBias * 0.25));
  const bodyWidth = Number((chassis.width || 18) + (airflow.widthBoost || 0) + (airflowBias / 130));
  const bodyHeight = Number((chassis.height || 118) + (battery.heightBoost || 0) + (sizeBias * 0.18));
  const capacityMl = Number((tank.capacity || 4) + (device.capacityBoost || 0));
  const wattageBase = (device.wattage || 18) + (battery.powerBoost || 0) + (coil.powerBoost || 0) + (airflow.wattageBoost || 0) + (tank.wattageBoost || 0) + (profile.powerBias || 0);
  const wattage = outputOverride ? outputOverride : Math.max(12, Math.round(wattageBase));
  const airflowScore = Number(Math.max(0, Math.min(100, (airflow.score || 80) + (chassis.airflowBonus || 0) + airflowBias * 0.18 + profile.powerBias * 0.5)));
  const batteryLifeHours = Number((battery.lifeHours || 1.4) + (device.efficiencyBonus || 0) + (profile.value === 'efficiency' ? 0.8 : 0));
  const cloudRating = Number((wattage / 20 + airflowScore / 100 + capacityMl / 12).toFixed(1));
  const tuningBoost = Math.max(0, sizeBias * 0.18) + Math.max(0, airflowBias * 0.12) + Math.max(0, (profile.powerBias || 0) * 1.3);
  const performanceIndex = Math.max(20, Math.round((wattage * 0.58 + airflowScore * 0.76 + capacityMl * 2.8 + tuningBoost) / 3));

  const price = [device, chassis, tank, flavor, battery, coil, finish, accessory].reduce((total, item) => {
    return total + Number(item.price || 0);
  }, 0);

  const designNotes = [
    `${profile.label} tuning mode keeps the draw ${airflow.label.toLowerCase()} with a focused ${device.label.toLowerCase()} body.`,
    `${finish.label} finish pairs with a ${chassis.label.toLowerCase()} shell for a premium custom silhouette.`,
    `${tank.label} gives the build ${capacityMl.toFixed(1)}mL of capacity and a ${batteryLifeHours.toFixed(1)} hour battery feel.`
  ];

  const summary = `${chassis.label} ${device.label} tuned for ${profile.label.toLowerCase()} airflow, with ${flavor.label} flavor and ${finish.label} finish${accessory.value === 'none' ? '' : ` + ${accessory.label}`}.`;

  return {
    device,
    chassis,
    tank,
    flavor,
    nicotine,
    battery,
    coil,
    airflow,
    color,
    finish,
    extra: accessory,
    accessory,
    profile: profile.value,
    price: Number(price.toFixed(2)),
    summary,
    designNotes,
    cadSpec: {
      bodyLength: Number(bodyLength.toFixed(1)),
      bodyWidth: Number(bodyWidth.toFixed(1)),
      bodyHeight: Number(bodyHeight.toFixed(1)),
      capacityMl: Number(capacityMl.toFixed(1)),
      shellProfile: chassis.label,
      finishTone: finish.tone || '#0f172a',
    },
    metrics: {
      wattage,
      airflowScore: Number(airflowScore.toFixed(0)),
      batteryLifeHours: Number(batteryLifeHours.toFixed(1)),
      cloudRating,
      performanceIndex,
    },
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
  const server = app.listen(PORT, () => {
    console.log(`Vape finder app is running on http://localhost:${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the existing process or start the app on a different port, for example: PORT=3001 npm start`);
      process.exit(1);
    }

    console.error('Failed to start the Vape Finder server:', error.message);
    process.exit(1);
  });
}

module.exports = {
  app,
  buildCustomVape,
  getVapeBuilderOptions,
};
