function generateSummaryTable(stats) {
    const formatDuration = (ms) => {
      if (ms === undefined || ms === null) return 'N/A';
      return ms >= 1000 ? (ms / 1000).toFixed(2) + 's' : ms.toFixed(2) + 'ms';
    };
  
    const safeGet = (obj, path, defaultValue = 'N/A') => {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj) || defaultValue;
    };
  
    console.log('Debug: Received stats object:', JSON.stringify(stats, null, 2));
  
    let table = '# K6 Load Test Summary Statistics (Excluding Smoke Test)\n\n';
  
    table += '## Test Results\n';
    table += '| Metric                | Total           | Process        | Finalize       |\n';
    table += '|-----------------------|-----------------|----------------|----------------|\n';
    table += `| http_reqs             | ${safeGet(stats, 'totalRequests')} | ${safeGet(stats, 'process.data.length')} | ${safeGet(stats, 'finalize.data.length')} |\n`;
    table += `| http_req_failed       | ${safeGet(stats, 'failedRequests')}/${safeGet(stats, 'totalRequests')} | ${safeGet(stats, 'process.failed')}/${safeGet(stats, 'process.data.length')} | ${safeGet(stats, 'finalize.failed')}/${safeGet(stats, 'finalize.data.length')} |\n`;
    table += `| iterations            | ${safeGet(stats, 'iterations')} | ${safeGet(stats, 'iterations')} | ${safeGet(stats, 'iterations')} |\n`;
    table += `| http_req_duration     | Avg: ${formatDuration((safeGet(stats, 'process.avg', 0) + safeGet(stats, 'finalize.avg', 0)) / 2)} | Avg: ${formatDuration(safeGet(stats, 'process.avg'))} | Avg: ${formatDuration(safeGet(stats, 'finalize.avg'))} |\n`;
    table += `|                       | Min: ${formatDuration(Math.min(safeGet(stats, 'process.min', Infinity), safeGet(stats, 'finalize.min', Infinity)))} | Min: ${formatDuration(safeGet(stats, 'process.min'))} | Min: ${formatDuration(safeGet(stats, 'finalize.min'))} |\n`;
    table += `|                       | Max: ${formatDuration(Math.max(safeGet(stats, 'process.max', -Infinity), safeGet(stats, 'finalize.max', -Infinity)))} | Max: ${formatDuration(safeGet(stats, 'process.max'))} | Max: ${formatDuration(safeGet(stats, 'finalize.max'))} |\n`;
    table += `|                       | Med: ${formatDuration((safeGet(stats, 'process.med', 0) + safeGet(stats, 'finalize.med', 0)) / 2)} | Med: ${formatDuration(safeGet(stats, 'process.med'))} | Med: ${formatDuration(safeGet(stats, 'finalize.med'))} |\n`;
    table += `|                       | p90: ${formatDuration((safeGet(stats, 'process.p90', 0) + safeGet(stats, 'finalize.p90', 0)) / 2)} | p90: ${formatDuration(safeGet(stats, 'process.p90'))} | p90: ${formatDuration(safeGet(stats, 'finalize.p90'))} |\n`;
    table += `|                       | p95: ${formatDuration((safeGet(stats, 'process.p95', 0) + safeGet(stats, 'finalize.p95', 0)) / 2)} | p95: ${formatDuration(safeGet(stats, 'process.p95'))} | p95: ${formatDuration(safeGet(stats, 'finalize.p95'))} |\n`;
  
    table += '\n## Additional Metrics\n';
    table += '| Metric                | Value           |\n';
    table += '|-----------------------|------------------|\n';
    table += `| iteration_duration    | Avg: ${formatDuration(safeGet(stats, 'iteration.avg'))} |\n`;
    table += `|                       | Min: ${formatDuration(safeGet(stats, 'iteration.min'))} |\n`;
    table += `|                       | Max: ${formatDuration(safeGet(stats, 'iteration.max'))} |\n`;
    table += `|                       | Med: ${formatDuration(safeGet(stats, 'iteration.med'))} |\n`;
    table += `| vus                   | Min: ${safeGet(stats, 'vus.min')}, Max: ${safeGet(stats, 'vus.max')} |\n`;
  
    return table;
  }
  
  module.exports = generateSummaryTable;