function formatDuration(ms) {
  return (ms / 1000).toFixed(2) + 's';
}

function generateSummaryReport(stats) {
  return `📊 *K6 Load Test Summary Statistics*
_(Excluding Smoke Test Requests)_

🔢 *Test Results*
• Total Requests: ${stats.totalRequests} (Process: ${stats.process.data.length}, Finalize: ${stats.finalize.data.length})
• Failed Requests: ${stats.failedRequests}/${stats.totalRequests} (Process: ${stats.process.failed}/${stats.process.data.length}, Finalize: ${stats.finalize.failed}/${stats.finalize.data.length})
• Iterations: ${stats.iterations}

⏱️ *HTTP Request Duration*
Process:
• Avg: ${formatDuration(stats.process.avg)}
• Min: ${formatDuration(stats.process.min)}
• Max: ${formatDuration(stats.process.max)}
• Median: ${formatDuration(stats.process.med)}
• 90th percentile: ${formatDuration(stats.process.p90)}
• 95th percentile: ${formatDuration(stats.process.p95)}

Finalize:
• Avg: ${formatDuration(stats.finalize.avg)}
• Min: ${formatDuration(stats.finalize.min)}
• Max: ${formatDuration(stats.finalize.max)}
• Median: ${formatDuration(stats.finalize.med)}
• 90th percentile: ${formatDuration(stats.finalize.p90)}
• 95th percentile: ${formatDuration(stats.finalize.p95)}

📈 *Additional Metrics*
• Iteration Duration:
  - Avg: ${formatDuration(stats.iteration.avg)}
  - Min: ${formatDuration(stats.iteration.min)}
  - Max: ${formatDuration(stats.iteration.max)}
  - Median: ${formatDuration(stats.iteration.med)}
• Virtual Users (VUs): Min: ${stats.vus.min}, Max: ${stats.vus.max}

Note: This summary excludes any requests made during the initial smoke test phase.`;
}

module.exports = generateSummaryReport;