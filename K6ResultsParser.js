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
      },
      iterations: [],
      vus: []
    };
  }

  parse() {
    const lines = this.data.split('\n');
    let mainTestStarted = false;

    lines.forEach(line => {
      if (line.trim() === '') return;

      const data = JSON.parse(line);

      if (data.data && data.data.tags && data.data.tags.scenario === 'main') {
        mainTestStarted = true;
      }

      if (!mainTestStarted) return;

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
      } else if (data.type === 'Point' && data.metric === 'iteration_duration') {
        this.results.iterations.push(data.data.value);
      } else if (data.type === 'Point' && data.metric === 'vus') {
        this.results.vus.push(data.data.value);
      }
    });

    return this.results;
  }

  calculateStatistics(data) {
    if (data.length === 0) return {};
    
    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const max = arr => Math.max(...arr);
    const min = arr => Math.min(...arr);
    const median = arr => {
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };
    const percentile = (arr, p) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[index];
    };

    return {
      avg: avg(data),
      max: max(data),
      min: min(data),
      med: median(data),
      p90: percentile(data, 90),
      p95: percentile(data, 95)
    };
  }

  generateSummaryStats() {
    const processStats = this.calculateStatistics(this.results.process.duration);
    const finalizeStats = this.calculateStatistics(this.results.finalize.duration);
    const iterationStats = this.calculateStatistics(this.results.iterations);

    return {
      process: {
        ...processStats,
        data: this.results.process.duration,
        failed: this.results.process.failed.filter(f => f).length
      },
      finalize: {
        ...finalizeStats,
        data: this.results.finalize.duration,
        failed: this.results.finalize.failed.filter(f => f).length
      },
      iteration: iterationStats,
      totalRequests: this.results.process.duration.length + this.results.finalize.duration.length,
      failedRequests: this.results.process.failed.filter(f => f).length + this.results.finalize.failed.filter(f => f).length,
      iterations: this.results.iterations.length,
      vus: {
        min: Math.min(...this.results.vus),
        max: Math.max(...this.results.vus)
      }
    };
  }

  generateChartData() {
    return {
      process: {
        data: this.results.process.duration,
        timestamps: this.results.process.timestamps
      },
      finalize: {
        data: this.results.finalize.duration,
        timestamps: this.results.finalize.timestamps
      }
    };
  }
}

module.exports = K6ResultsParser;