import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import exec from 'k6/execution';

const failureRate = new Rate('failed_requests');
const BASE_URL = 'http://localhost:3000';

const mainScenarioName = __ENV.SCENARIO || 'load';

const scenarios = {
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1s', target: 10 },
      { duration: '10s', target: 30 },
      { duration: '1s', target: 0 },
    ],
  },
  soak: {
    executor: 'constant-vus',
    vus: 50,
    duration: '2h',
  },
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 50 },
      { duration: '1m', target: 500 },
      { duration: '2m', target: 50 },
    ],
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '5m', target: 100 },
      { duration: '10m', target: 200 },
      { duration: '10m', target: 300 },
      { duration: '10m', target: 400 },
      { duration: '5m', target: 0 },
    ],
  },
};

export const options = {
  scenarios: {
    smoke: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '10s',
      exec: 'smokeTest',
    },
    main: Object.assign({}, scenarios[mainScenarioName], {
      startTime: '10s',
      exec: 'mainTest',
    }),
  },
};

export function setup() {
  if (!scenarios[mainScenarioName]) {
    throw new Error('Invalid scenario: ' + mainScenarioName);
  }
}

export function smokeTest() {
  console.log("Starting smoke test");
  const smokeTest = http.post(BASE_URL + '/process', JSON.stringify({ data: 'smoke_test' }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const success = check(smokeTest, {
    'smoke test status is 200': (r) => r.status === 200,
  });

  if (!success) {
    console.error('Smoke test failed. Aborting main test.');
    exec.test.abort();
  } else {
    console.log("Smoke test passed");
  }
}

export function mainTest() {
  const processResponse = http.post(
    BASE_URL + '/process',
    JSON.stringify({ data: 'test_data' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(processResponse, {
    'process status is 200': (r) => r.status === 200,
  }) || failureRate.add(1);

  if (processResponse.status === 200) {
    const processedData = JSON.parse(processResponse.body).processedData;

    const finalizeResponse = http.post(
      BASE_URL + '/finalize',
      JSON.stringify({ processedData: processedData }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(finalizeResponse, {
      'finalize status is 200': (r) => r.status === 200,
    }) || failureRate.add(1);
  }

  sleep(1);
}
