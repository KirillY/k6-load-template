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
        stats: processStats
      },
      finalize: {
        data: this.results.finalize.duration,
        stats: finalizeStats
      }
    };
  }
}

function generateASCIIChart(data, title, width = 60, height = 20) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const step = range / height;

  let chart = `${title}\n`;
  chart += `${max.toFixed(2)} ┤\n`;

  for (let i = height - 1; i >= 0; i--) {
    const threshold = max - step * (height - i);
    let line = data.map(value => (value >= threshold ? '█' : ' ')).join('');
    chart += `${threshold.toFixed(2).padStart(8)} ┤${line}\n`;
  }

  chart += `${min.toFixed(2)} ┤${'─'.repeat(width)}\n`;
  chart += `         ${' '.repeat(Math.floor(width / 2) - 5)}Time →\n`;

  return chart;
}

// Main execution
const filePath = 'k6-results.json';
const parser = new K6ResultsParser(filePath);
parser.parse();
const chartData = parser.generateChartData();

const processChart = generateASCIIChart(chartData.process.data, 'Process Request Duration');
const finalizeChart = generateASCIIChart(chartData.finalize.data, 'Finalize Request Duration');

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
console.log('Slack message:');
console.log(slackMessage);

// Optionally, save the message to a file
fs.writeFileSync('slack_message.txt', slackMessage);
console.log('Slack message saved to slack_message.txt');