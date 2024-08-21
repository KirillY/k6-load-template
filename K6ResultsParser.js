const fs = require('fs');

class K6ResultsParser {
  constructor(data) {
    this.data = data;
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
    const lines = this.data.split('\n');

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

module.exports = K6ResultsParser;