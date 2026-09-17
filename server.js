const express = require('express');
const path = require('path');
const { getStores, ZIP_COORDINATES } = require('./data/storeRepository');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'vape-finder',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
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

app.listen(PORT, () => {
  console.log(`Vape finder app is running on http://localhost:${PORT}`);
});
