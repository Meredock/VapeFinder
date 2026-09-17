const form = document.getElementById('searchForm');
const resultsContainer = document.getElementById('results');
const resultCount = document.getElementById('resultCount');
const nearMeButton = document.getElementById('nearMeButton');
const locationStatus = document.getElementById('locationStatus');

function buildParams() {
  const params = new URLSearchParams({
    query: document.getElementById('query').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
    zip: document.getElementById('zip').value,
    product: document.getElementById('product').value,
  });

  const distance = document.getElementById('distance').value;
  const deliveryOnly = document.getElementById('deliveryOnly').checked;
  const lat = document.getElementById('lat').value;
  const lng = document.getElementById('lng').value;

  if (distance) {
    params.set('distance', distance);
  }

  if (deliveryOnly) {
    params.set('deliveryOnly', 'true');
  }

  if (lat && lng) {
    params.set('lat', lat);
    params.set('lng', lng);
  }

  return params;
}

async function searchStores(event) {
  if (event) {
    event.preventDefault();
  }

  try {
    const params = buildParams();
    const response = await fetch(`/api/stores?${params.toString()}`);
    const data = await response.json();

    resultCount.textContent = `${data.total} store${data.total === 1 ? '' : 's'}`;

    if (!data.results.length) {
      resultsContainer.innerHTML = '<div class="empty-state">No matching vape stores were found. Try a broader search or remove the distance filter.</div>';
      return;
    }

    resultsContainer.innerHTML = data.results
      .map((store) => {
        const distanceLabel = Number.isFinite(store.distanceMiles)
          ? `<span class="distance">${store.distanceMiles} mi away</span>`
          : '';

        const deliveryBadge = store.delivery ? '<span class="badge delivery">Delivery</span>' : '';
        const featuredBadge = store.featured ? '<span class="badge featured">Featured</span>' : '';

        return `
          <article class="store-card">
            <div class="store-top">
              <h3>${store.name}</h3>
              <span class="rating">★ ${store.rating.toFixed(1)}</span>
            </div>

            <div class="badge-row">
              ${deliveryBadge}
              ${featuredBadge}
            </div>

            <div class="meta">
              ${store.address}<br />
              ${store.city}, ${store.state} ${store.zip}<br />
              ${store.phone}
            </div>

            <div class="tag-list">
              ${store.products.map((item) => `<span class="tag">${item}</span>`).join('')}
            </div>

            <div class="card-actions">
              <a href="${store.website}" target="_blank" rel="noreferrer">Visit website</a>
              ${distanceLabel}
            </div>
          </article>
        `;
      })
      .join('');
  } catch (error) {
    resultsContainer.innerHTML = '<div class="empty-state">Something went wrong while loading stores. Please try again.</div>';
    console.error(error);
  }
}

nearMeButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    locationStatus.textContent = 'Geolocation is not supported in this browser.';
    return;
  }

  locationStatus.textContent = 'Finding your location...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      document.getElementById('lat').value = position.coords.latitude;
      document.getElementById('lng').value = position.coords.longitude;
      document.getElementById('distance').value = '25';
      locationStatus.textContent = 'Using your current location.';
      searchStores();
    },
    () => {
      locationStatus.textContent = 'Location access was denied. Try entering a ZIP code instead.';
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
});

form.addEventListener('submit', searchStores);
searchStores({ preventDefault() {} });
