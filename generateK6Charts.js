const fs = require('fs');

class K6ResultsParser {
  constructor(filePath) {
    this.filePath = filePath;
    this.results = {
      process: {
        duration: [],
        failed: [],
        timestamps: []
      },
      finalize: {
        duration: [],
        failed: [],
        timestamps: []
      }
    };
  }

  parse() {
    const fileContent = fs.readFileSync(this.filePath, 'utf-8');
    const lines = fileContent.split('\n');

    lines.forEach(line => {
      if (line.trim() === '') return;

      const data = JSON.parse(line);

      if (data.type === 'Point' && data.metric === 'http_req_duration') {
        const timestamp = new Date(data.data.time).getTime();
        const duration = data.data.value;
        const name = data.data.tags.name;

        if (name.includes('/process')) {
          this.results.process.duration.push(duration);
          this.results.process.timestamps.push(timestamp);
        } else if (name.includes('/finalize')) {
          this.results.finalize.duration.push(duration);
          this.results.finalize.timestamps.push(timestamp);
        }
      } else if (data.type === 'Point' && data.metric === 'http_req_failed') {
        const failed = data.data.value;
        const name = data.data.tags.name;

        if (name.includes('/process')) {
          this.results.process.failed.push(failed);
        } else if (name.includes('/finalize')) {
          this.results.finalize.failed.push(failed);
        }
      }
    });

    return this.results;
  }

  calculateStatistics(data) {
    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const max = arr => Math.max(...arr);
    const min = arr => Math.min(...arr);
    const percentile = (arr, p) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[index];
    };

    return {
      avg: avg(data),
      max: max(data),
      min: min(data),
      p90: percentile(data, 90),
      p95: percentile(data, 95)
    };
  }

  generateChartData() {
    const processStats = this.calculateStatistics(this.results.process.duration);
    const finalizeStats = this.calculateStatistics(this.results.finalize.duration);

    return {
      process: {
        data: this.results.process.duration,
        timestamps: this.results.process.timestamps,
        stats: processStats
      },
      finalize: {
        data: this.results.finalize.duration,
        timestamps: this.results.finalize.timestamps,
        stats: finalizeStats
      }
    };
  }
}

function generateASCIIChart(data, timestamps, title, width = 60, height = 20) {
    if (data.length === 0 || timestamps.length === 0) {
      return `No data available for ${title}`;
    }
  
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const step = range / height;
  
    const startTime = new Date(Math.min(...timestamps));
    const endTime = new Date(Math.max(...timestamps));
    const duration = (endTime - startTime) / 1000; // duration in seconds
  
    // Calculate requests per second for each time slice
    const timeSlices = new Array(width).fill(0);
    data.forEach((_, index) => {
      const sliceIndex = Math.floor((timestamps[index] - startTime) / (duration * 1000 / width));
      if (sliceIndex >= 0 && sliceIndex < width) {
        timeSlices[sliceIndex]++;
      }
    });
    const maxRps = duration > 0 ? Math.max(...timeSlices) / (duration / width) : 0;
  
    // Scale the data to fit the width
    const scaledData = new Array(width).fill(min);
    data.forEach((value, index) => {
      const scaledIndex = Math.floor((timestamps[index] - startTime) / (duration * 1000 / width));
      if (scaledIndex >= 0 && scaledIndex < width) {
        scaledData[scaledIndex] = Math.max(scaledData[scaledIndex], value);
      }
    });
  
    let chart = `${title}\n`;
    chart += `${max.toFixed(2)} ms ┤ ${maxRps.toFixed(2)} req/s\n`;
  
    for (let i = height - 1; i >= 0; i--) {
      const latencyThreshold = max - step * (height - i);
      const rpsThreshold = maxRps * (i + 1) / height;
      let line = '';
      for (let j = 0; j < width; j++) {
        if (scaledData[j] >= latencyThreshold) {
          line += '█';
        } else if (duration > 0 && (timeSlices[j] / (duration / width)) >= rpsThreshold) {
          line += '▒';
        } else {
          line += ' ';
        }
      }
      chart += `${latencyThreshold.toFixed(2).padStart(8)} ms ┤${line} ${rpsThreshold.toFixed(2)} req/s\n`;
    }
  
    chart += `${min.toFixed(2)} ms ┤${'─'.repeat(width)}\n`;
    chart += `              ${' '.repeat(Math.floor(width / 2) - 5)}Time →\n`;
    chart += `              0s${' '.repeat(width - 7)}${duration.toFixed(0)}s\n`;
    chart += `              █ = Latency   ▒ = Request Rate\n`;
  
    return chart;
  }

// Main execution
const filePath = 'k6-results.json';
const parser = new K6ResultsParser(filePath);
parser.parse();
const chartData = parser.generateChartData();

const processChart = generateASCIIChart(chartData.process.data, chartData.process.timestamps, 'Process Request Duration');
const finalizeChart = generateASCIIChart(chartData.finalize.data, chartData.finalize.timestamps, 'Finalize Request Duration');

// Generate Slack message
const generateSlackMessage = (chartData, processChart, finalizeChart) => {
  return `
:chart_with_upwards_trend: *K6 Load Test Results* :chart_with_upwards_trend:

*Process Request*
• Average: ${chartData.process.stats.avg.toFixed(2)} ms
• Max: ${chartData.process.stats.max.toFixed(2)} ms
• Min: ${chartData.process.stats.min.toFixed(2)} ms
• 90th percentile: ${chartData.process.stats.p90.toFixed(2)} ms
• 95th percentile: ${chartData.process.stats.p95.toFixed(2)} ms

\`\`\`
${processChart}
\`\`\`

*Finalize Request*
• Average: ${chartData.finalize.stats.avg.toFixed(2)} ms
• Max: ${chartData.finalize.stats.max.toFixed(2)} ms
• Min: ${chartData.finalize.stats.min.toFixed(2)} ms
• 90th percentile: ${chartData.finalize.stats.p90.toFixed(2)} ms
• 95th percentile: ${chartData.finalize.stats.p95.toFixed(2)} ms

\`\`\`
${finalizeChart}
\`\`\`
  `;
};

const slackMessage = generateSlackMessage(chartData, processChart, finalizeChart);
console.log(slackMessage);

// Optionally, save the message to a file
fs.writeFileSync('slack_message.txt', slackMessage);
console.log('Slack message saved to slack_message.txt');