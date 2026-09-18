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

test('buildCustomVape returns CAD geometry and performance metrics', () => {
  const result = buildCustomVape({
    chassis: 'aero',
    tank: 'pro',
    battery: '1500mAh',
    coil: 'dual',
    airflow: 'loose',
    finish: 'obsidian',
    accessory: 'travel-case',
    flavor: 'mango',
    nicotine: '6mg',
  });

  assert.ok(result.cadSpec);
  assert.ok(typeof result.cadSpec.bodyLength === 'number');
  assert.ok(result.metrics.wattage >= 20);
  assert.ok(result.metrics.airflowScore >= 0);
  assert.match(result.summary, /Aero Shell/i);
});

test('buildCustomVape supports interactive tuning profiles', () => {
  const result = buildCustomVape({
    device: 'box',
    chassis: 'max',
    tank: 'xl',
    battery: '1500mAh',
    coil: 'dual',
    airflow: 'loose',
    finish: 'crimson',
    accessory: 'none',
    profile: 'cloud',
    output: 36,
    sizeBias: 22,
    airflowBias: 86,
  });

  assert.equal(result.profile, 'cloud');
  assert.ok(result.metrics.performanceIndex >= 40);
  assert.ok(Array.isArray(result.designNotes) && result.designNotes.length > 0);
});

test('getVapeBuilderOptions exposes the available builder choices', () => {
  const options = getVapeBuilderOptions();

  assert.ok(Array.isArray(options.devices));
  assert.ok(Array.isArray(options.flavors));
  assert.ok(Array.isArray(options.nicotine));
  assert.ok(Array.isArray(options.colors));
  assert.ok(Array.isArray(options.chassis));
  assert.ok(options.devices.some((device) => device.value === 'pod'));
  assert.ok(options.flavors.some((flavor) => flavor.value === 'blueberry'));
  assert.ok(options.chassis.some((entry) => entry.value === 'aero'));
});
