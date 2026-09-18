const form = document.getElementById('searchForm');
const resultsContainer = document.getElementById('results');
const resultCount = document.getElementById('resultCount');
const nearMeButton = document.getElementById('nearMeButton');
const locationStatus = document.getElementById('locationStatus');
const builderForm = document.getElementById('builderForm');
const builderResult = document.getElementById('builderResult');
const builderPrice = document.getElementById('builderPrice');
const vapeVisual = document.getElementById('vapeVisual');
const previewLength = document.getElementById('previewLength');
const previewWidth = document.getElementById('previewWidth');
const previewCapacity = document.getElementById('previewCapacity');
const previewPower = document.getElementById('previewPower');
const outputSlider = document.getElementById('builder-output');
const sizeSlider = document.getElementById('builder-size');
const airflowSlider = document.getElementById('builder-airflowBias');
const outputValue = document.getElementById('outputValue');
const sizeValue = document.getElementById('sizeValue');
const airflowValue = document.getElementById('airflowValue');

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

function renderOptions(select, options, placeholder = '') {
  if (!select) return;
  const items = (options || []).map((option) => `<option value="${option.value}">${option.label}</option>`).join('');
  select.innerHTML = placeholder ? `<option value="">${placeholder}</option>${items}` : items;
}

function updateSliderReadouts() {
  outputValue.textContent = `${outputSlider.value}W`;
  sizeValue.textContent = `${sizeSlider.value}%`;
  airflowValue.textContent = `${airflowSlider.value}%`;
}

function getBuilderSelection() {
  return {
    device: document.getElementById('builder-device').value,
    chassis: document.getElementById('builder-chassis').value,
    tank: document.getElementById('builder-tank').value,
    flavor: document.getElementById('builder-flavor').value,
    nicotine: document.getElementById('builder-nicotine').value,
    battery: document.getElementById('builder-battery').value,
    coil: document.getElementById('builder-coil').value,
    airflow: document.getElementById('builder-airflow').value,
    color: document.getElementById('builder-color').value,
    finish: document.getElementById('builder-finish').value,
    profile: document.getElementById('builder-profile').value,
    accessory: document.getElementById('builder-accessory').value,
    extra: document.getElementById('builder-extra').value,
    output: Number(outputSlider.value),
    sizeBias: Number(sizeSlider.value),
    airflowBias: Number(airflowSlider.value),
  };
}

function updateVapePreview(result) {
  if (!result) return;
  const scriptColor = result.finish?.tone || result.color?.label || '#0f172a';
  const bodyLength = result.cadSpec?.bodyLength || 92;
  const bodyWidth = result.cadSpec?.bodyWidth || 19;
  const bodyHeight = result.cadSpec?.bodyHeight || 118;
  const capacity = result.cadSpec?.capacityMl || 7.6;

  vapeVisual.style.setProperty('--shell-color', scriptColor);
  vapeVisual.style.setProperty('--body-length', `${Math.max(120, Math.min(200, bodyLength))}px`);
  vapeVisual.style.setProperty('--body-width', `${Math.max(58, Math.min(120, bodyWidth * 4.8))}px`);
  vapeVisual.style.setProperty('--body-height', `${Math.max(120, Math.min(220, bodyHeight))}px`);

  previewLength.textContent = `${Math.round(bodyLength)}mm`;
  previewWidth.textContent = `${Math.round(bodyWidth)}mm`;
  previewCapacity.textContent = `${Number(capacity).toFixed(1)}mL`;
  previewPower.textContent = `${result.metrics?.wattage ?? 24}W`;
}

async function loadBuilderOptions() {
  try {
    const response = await fetch('/api/custom-vape/options');
    const data = await response.json();
    const { options } = data;

    renderOptions(document.getElementById('builder-device'), options.devices);
    renderOptions(document.getElementById('builder-chassis'), options.chassis);
    renderOptions(document.getElementById('builder-tank'), options.tanks);
    renderOptions(document.getElementById('builder-flavor'), options.flavors);
    renderOptions(document.getElementById('builder-nicotine'), options.nicotine);
    renderOptions(document.getElementById('builder-battery'), options.battery);
    renderOptions(document.getElementById('builder-coil'), options.coil);
    renderOptions(document.getElementById('builder-airflow'), options.airflow);
    renderOptions(document.getElementById('builder-finish'), options.finishes);
    renderOptions(document.getElementById('builder-color'), options.colors);
    renderOptions(document.getElementById('builder-profile'), options.profiles);
    renderOptions(document.getElementById('builder-accessory'), options.accessories);
    renderOptions(document.getElementById('builder-extra'), options.extras);

    document.getElementById('builder-device').value = 'pod';
    document.getElementById('builder-chassis').value = 'aero';
    document.getElementById('builder-tank').value = 'pro';
    document.getElementById('builder-flavor').value = 'blueberry';
    document.getElementById('builder-nicotine').value = '3mg';
    document.getElementById('builder-battery').value = '950mAh';
    document.getElementById('builder-coil').value = 'mesh';
    document.getElementById('builder-airflow').value = 'balanced';
    document.getElementById('builder-finish').value = 'obsidian';
    document.getElementById('builder-color').value = 'midnight';
    document.getElementById('builder-profile').value = 'balanced';
    document.getElementById('builder-accessory').value = 'travel-case';
    document.getElementById('builder-extra').value = 'travel-case';

    updateSliderReadouts();
    await buildCustomKit({ preventDefault() {} });
  } catch (error) {
    builderResult.textContent = 'The custom vape builder is unavailable right now. Please refresh later.';
    console.error(error);
  }
}

async function buildCustomKit(event) {
  if (event) {
    event.preventDefault();
  }

  const payload = getBuilderSelection();

  try {
    const response = await fetch('/api/custom-vape/build', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const result = data.result;

    if (!result) {
      builderResult.textContent = 'Your vape setup could not be built. Please try a different combination.';
      return;
    }

    builderPrice.textContent = `$${result.price.toFixed(2)}`;
    updateVapePreview(result);

    builderResult.innerHTML = `
      <div class="builder-summary">${result.summary}</div>
      <div class="metric-grid">
        <div class="metric-item"><span>Wattage</span><strong>${result.metrics.wattage}W</strong></div>
        <div class="metric-item"><span>Airflow</span><strong>${result.metrics.airflowScore}/100</strong></div>
        <div class="metric-item"><span>Battery</span><strong>${result.metrics.batteryLifeHours.toFixed(1)}h</strong></div>
        <div class="metric-item"><span>Performance</span><strong>${result.metrics.performanceIndex}</strong></div>
      </div>
      <div class="design-note-list">
        ${result.designNotes.map((note) => `<div class="design-note">${note}</div>`).join('')}
      </div>
      <ul class="builder-list">
        <li><strong>Chassis:</strong> ${result.chassis.label}</li>
        <li><strong>Tank:</strong> ${result.tank.label}</li>
        <li><strong>Flavor:</strong> ${result.flavor.label}</li>
        <li><strong>Finish:</strong> ${result.finish.label}</li>
        <li><strong>Accessory:</strong> ${result.accessory.label}</li>
      </ul>
    `;
  } catch (error) {
    builderResult.textContent = 'We hit an error while building your vape. Please try again.';
    console.error(error);
  }
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
builderForm.addEventListener('submit', buildCustomKit);
outputSlider.addEventListener('input', () => {
  updateSliderReadouts();
  buildCustomKit({ preventDefault() {} });
});
sizeSlider.addEventListener('input', () => {
  updateSliderReadouts();
  buildCustomKit({ preventDefault() {} });
});
airflowSlider.addEventListener('input', () => {
  updateSliderReadouts();
  buildCustomKit({ preventDefault() {} });
});
['builder-device', 'builder-chassis', 'builder-tank', 'builder-flavor', 'builder-nicotine', 'builder-battery', 'builder-coil', 'builder-airflow', 'builder-finish', 'builder-color', 'builder-profile', 'builder-accessory', 'builder-extra'].forEach((id) => {
  const control = document.getElementById(id);
  if (control) {
    control.addEventListener('change', () => buildCustomKit({ preventDefault() {} }));
  }
});

searchStores({ preventDefault() {} });
loadBuilderOptions();
