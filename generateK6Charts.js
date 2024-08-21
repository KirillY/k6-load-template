const fs = require('fs');
const K6ResultsParser = require('./K6ResultsParser');
const generateASCIIChart = require('./generateASCIIChart');

function generateK6Charts(inputData, outputDir = '.') {
  const parser = new K6ResultsParser(inputData);
  parser.parse();
  const chartData = parser.generateChartData();

  const processChart = generateASCIIChart(chartData.process.data, chartData.process.timestamps, 'Process Request Duration');
  const finalizeChart = generateASCIIChart(chartData.finalize.data, chartData.finalize.timestamps, 'Finalize Request Duration');

  // Generate summary text
  const summaryText = `
K6 Load Test Results

Process Request:
• Average: ${chartData.process.stats.avg.toFixed(2)} ms
• Max: ${chartData.process.stats.max.toFixed(2)} ms
• Min: ${chartData.process.stats.min.toFixed(2)} ms
• 90th percentile: ${chartData.process.stats.p90.toFixed(2)} ms
• 95th percentile: ${chartData.process.stats.p95.toFixed(2)} ms

Finalize Request:
• Average: ${chartData.finalize.stats.avg.toFixed(2)} ms
• Max: ${chartData.finalize.stats.max.toFixed(2)} ms
• Min: ${chartData.finalize.stats.min.toFixed(2)} ms
• 90th percentile: ${chartData.finalize.stats.p90.toFixed(2)} ms
• 95th percentile: ${chartData.finalize.stats.p95.toFixed(2)} ms
`;

  // Write to files if outputDir is provided
  if (outputDir) {
    fs.writeFileSync(`${outputDir}/process_chart.txt`, processChart);
    fs.writeFileSync(`${outputDir}/finalize_chart.txt`, finalizeChart);
    fs.writeFileSync(`${outputDir}/summary.txt`, summaryText);
    console.log('Charts and summary saved to files.');
  }

  return {
    processChart,
    finalizeChart,
    summaryText
  };
}

module.exports = generateK6Charts;