const { spawn } = require('child_process');

const scenario = process.argv[2] || 'load';

console.log(`Running k6 tests with scenario: ${scenario}`);

const k6Process = spawn('k6', ['run', '--out', 'json=k6-results.json', '-e', `SCENARIO=${scenario}`, 'k6RunTests.mjs'], {
  stdio: ['inherit', 'inherit', 'inherit']
});

k6Process.on('close', (code) => {
  console.log(`K6 tests completed with exit code ${code}`);
});

k6Process.on('error', (error) => {
  console.error(`Error running k6: ${error.message}`);
});