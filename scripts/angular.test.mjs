import assert from 'node:assert/strict';
import { test } from 'node:test';
import { angularArgs } from './angular.mjs';

test('production requires a supplied URL even when the tracked local .env exists', () => {
  for (const args of [
    ['build'],
    ['serve', '--configuration', 'production'],
    ['build', '--watch', '-c', 'production'],
    ['serve', '--build-target=web:build:production'],
  ]) {
    assert.throws(() => angularArgs(args, {}), /API_URL is required/);
  }
  for (const API_URL of ['', '   ', '/api', 'not-a-url', 'ftp://backend.example']) {
    assert.throws(() => angularArgs(['build'], { API_URL }), /API_URL/);
  }
});

test('supplied URL wins over .env and is encoded as a JavaScript string literal', () => {
  const API_URL = "https://backend.example/tenant's";
  for (const args of [['build'], ['serve'], ['build', '--watch', '-c', 'development']]) {
    const result = angularArgs(args, { API_URL });
    assert.deepEqual(result.slice(0, -2), args);
    assert.equal(result.at(-2), '--define');
    assert.equal(JSON.parse(result.at(-1).slice('API_URL='.length)), API_URL);
    assert.ok(!result.at(-1).includes('127.0.0.1'));
  }
});

test('development server and builds default to the tracked local backend', () => {
  for (const args of [
    ['serve'],
    ['build', '--watch', '--configuration', 'development'],
    ['build', '--configuration=development'],
    ['build', '-c', 'development'],
  ]) {
    assert.equal(angularArgs(args, {}).at(-1), 'API_URL="http://127.0.0.1:8000"');
  }
});
