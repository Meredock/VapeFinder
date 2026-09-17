const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'stores.json');
const fileContents = fs.readFileSync(dbPath, 'utf8');
const { stores } = JSON.parse(fileContents);

const normalizedStores = stores.map((store, index) => ({
  ...store,
  id: store.id || index + 1,
  products: Array.isArray(store.products) ? store.products : [],
  latitude: Number(store.latitude),
  longitude: Number(store.longitude),
  rating: Number(store.rating) || 0,
}));

const ZIP_COORDINATES = Object.fromEntries(
  normalizedStores
    .filter((store) => Number.isFinite(store.latitude) && Number.isFinite(store.longitude))
    .map((store) => [String(store.zip), { latitude: store.latitude, longitude: store.longitude }])
);

function getStores() {
  return normalizedStores.map((store) => ({
    ...store,
    products: [...store.products],
  }));
}

module.exports = {
  getStores,
  ZIP_COORDINATES,
};
