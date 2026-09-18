const test = require('node:test');
const assert = require('node:assert/strict');

const { buildCustomVape, getVapeBuilderOptions } = require('../server');

test('buildCustomVape calculates a valid custom kit estimate', () => {
  const result = buildCustomVape({
    device: 'pod',
    flavor: 'blueberry',
    nicotine: '3mg',
    battery: '950mAh',
    coil: 'mesh',
    airflow: 'tight',
    color: 'midnight',
    extra: 'travel-case',
  });

  assert.equal(result.device.label, 'Pod System');
  assert.equal(result.flavor.label, 'Blueberry Burst');
  assert.equal(result.nicotine.label, '3mg');
  assert.ok(result.price >= 28);
  assert.match(result.summary, /Blueberry Burst/i);
  assert.match(result.summary, /Pod System/i);
});

test('getVapeBuilderOptions exposes the available builder choices', () => {
  const options = getVapeBuilderOptions();

  assert.ok(Array.isArray(options.devices));
  assert.ok(Array.isArray(options.flavors));
  assert.ok(Array.isArray(options.nicotine));
  assert.ok(Array.isArray(options.colors));
  assert.ok(options.devices.some((device) => device.value === 'pod'));
  assert.ok(options.flavors.some((flavor) => flavor.value === 'blueberry'));
});
