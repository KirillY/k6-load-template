const { spawn } = require('child_process');
const fs = require('fs');
const K6ResultsParser = require('./K6ResultsParser');
const generateASCIIChart = require('./generateASCIIChart');
const generateSummaryTable = require('./generateSummaryTable');
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
    await runCommand('k6', ['run', '--out', 'json=k6-results.json', '-e', `SCENARIO=${scenario}`, 'k6RunTests.mjs']);
    console.log('K6 tests completed successfully');
  } catch (error) {
    console.error('Error running K6 tests:', error.message);
    throw error;
  }
}

async function generateCharts(inputFile) {
  console.log('Generating charts...');
  try {
    const inputData = fs.readFileSync(inputFile, 'utf-8');
    const parser = new K6ResultsParser(inputData);
    parser.parse();
    const summaryStats = parser.generateSummaryStats();
    const chartData = parser.generateChartData();

    console.log('Debug: Generated summary stats:', JSON.stringify(summaryStats, null, 2));

    const summaryTable = generateSummaryTable(summaryStats);
    const processChart = generateASCIIChart(chartData.process.data, chartData.process.timestamps, 'Process Request Duration');
    const finalizeChart = generateASCIIChart(chartData.finalize.data, chartData.finalize.timestamps, 'Finalize Request Duration');

    console.log('Charts and summary generated successfully');
    return { summaryTable, processChart, finalizeChart };
  } catch (error) {
    console.error('Error generating charts:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
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
    throw error;
  }
}

async function main() {
  const scenario = process.argv[2] || 'load';

  try {
    await runK6Tests(scenario);
    const { summaryTable, processChart, finalizeChart } = await generateCharts('k6-results.json');
    
    console.log(summaryTable);
    console.log(processChart);
    console.log(finalizeChart);

    if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID) {
      await sendToSlack(summaryTable, processChart, finalizeChart);
    } else {
      console.log('Slack credentials not provided. Skipping Slack notification.');
    }
  } catch (error) {
    console.error('An error occurred:', error.message);
    process.exit(1);
  }
}

main();