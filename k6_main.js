const { spawn } = require('child_process');
const fs = require('fs');
const generateK6Charts = require('./generateK6Charts');
const { WebClient } = require('@slack/web-api');

const web = new WebClient(process.env.SLACK_BOT_TOKEN);
const channelId = process.env.SLACK_CHANNEL_ID;

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: ['inherit', 'inherit', 'inherit']
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function runK6Tests(scenario = 'load') {
  console.log(`Running K6 tests with scenario: ${scenario}`);
  try {
    await runCommand('k6', ['run', '--out', 'json=k6-results.json', '-e', `SCENARIO=${scenario}`, 'k6RunTests.js']);
    console.log('K6 tests completed successfully');
  } catch (error) {
    console.error('Error running K6 tests:', error.message);
    throw error;
  }
}

async function generateCharts(inputFile, useFiles = true) {
  console.log('Generating charts...');
  const inputData = fs.readFileSync(inputFile, 'utf-8');
  const result = generateK6Charts(inputData, useFiles ? '.' : null);
  console.log('Charts generated successfully');
  return result;
}

async function sendToSlack(summaryText, processChart, finalizeChart) {
  console.log('Sending results to Slack...');
  try {
    await web.chat.postMessage({
      channel: channelId,
      text: summaryText,
    });
    console.log('Summary sent to Slack');

    await web.files.uploadV2({
      channel_id: channelId,
      content: processChart,
      filename: 'process_chart.txt',
      title: 'Process Request Duration Chart',
    });
    console.log('Process chart sent to Slack');

    await web.files.uploadV2({
      channel_id: channelId,
      content: finalizeChart,
      filename: 'finalize_chart.txt',
      title: 'Finalize Request Duration Chart',
    });
    console.log('Finalize chart sent to Slack');

    console.log('All results sent to Slack successfully');
  } catch (error) {
    console.error('Error sending results to Slack:', error.message);
  }
}

async function main() {
  const scenario = process.argv[2] || 'load';
  const useFiles = process.argv[3] !== 'no-files';

  try {
    await runK6Tests(scenario);
    const { summaryText, processChart, finalizeChart } = await generateCharts('k6-results.json', useFiles);
    await sendToSlack(summaryText, processChart, finalizeChart);
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

main();