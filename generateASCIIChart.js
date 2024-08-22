function generateASCIIChart(data, timestamps, title, width = 30, height = 20) {
    if (data.length === 0 || timestamps.length === 0) {
      return `No data available for ${title}`;
    }
  
    // Remove the first data point (smoke test)
    data = data.slice(1);
    timestamps = timestamps.slice(1);
  
    const startTime = new Date(Math.min(...timestamps));
    const endTime = new Date(Math.max(...timestamps));
    const duration = (endTime - startTime) / 1000; // duration in seconds
  
    // Calculate requests per second for each data point
    const rpsData = timestamps.map((timestamp, index) => {
      const prevTimestamp = index > 0 ? timestamps[index - 1] : timestamp;
      const timeDiff = (new Date(timestamp) - new Date(prevTimestamp)) / 1000;
      return timeDiff > 0 ? 1 / timeDiff : 0;
    });
  
    // Group data into time slices
    const sliceDuration = duration / width;
    const latencySlices = new Array(width).fill(0).map(() => []);
    const rpsSlices = new Array(width).fill(0).map(() => []);
  
    timestamps.forEach((timestamp, index) => {
      const sliceIndex = Math.min(Math.floor((new Date(timestamp) - startTime) / (sliceDuration * 1000)), width - 1);
      latencySlices[sliceIndex].push(data[index]);
      rpsSlices[sliceIndex].push(rpsData[index]);
    });
  
    // Calculate average for each slice
    const avgLatencyData = latencySlices.map(slice => slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : 0);
    const avgRpsData = rpsSlices.map(slice => slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : 0);
  
    // Scale the data to fit the height
    const minLatency = Math.min(...avgLatencyData.filter(v => v > 0));
    const maxLatency = Math.max(...avgLatencyData);
    const minRps = Math.min(...avgRpsData.filter(v => v > 0));
    const maxRps = Math.max(...avgRpsData);
  
    const scaleLatency = (value) => value === 0 ? -1 : Math.floor((value - minLatency) / (maxLatency - minLatency) * (height - 1));
    const scaleRps = (value) => value === 0 ? -1 : Math.floor((value - minRps) / (maxRps - minRps) * (height - 1));
  
    // Create the charts
    let chart = `${title}\n\n`;
    const leftPadding = 12; // Adjust this value to fit your largest number
    chart += `Latency (ms)`.padStart(leftPadding) + ' '.repeat(width + 1) + '│ ' + 'Requests/s'.padStart(leftPadding) + ' '.repeat(width) + '\n';
  
    for (let i = height - 1; i >= 0; i--) {
      let latencyValue = minLatency + (maxLatency - minLatency) * (i / (height - 1));
      let rpsValue = minRps + (maxRps - minRps) * (i / (height - 1));
      let latencyLine = latencyValue.toFixed(2).padStart(leftPadding) + ' │';
      let rpsLine = rpsValue.toFixed(2).padStart(leftPadding) + ' │';
  
      for (let j = 0; j < width; j++) {
        const latencyHeight = scaleLatency(avgLatencyData[j]);
        const rpsHeight = scaleRps(avgRpsData[j]);
  
        latencyLine += latencyHeight >= i ? '█' : ' ';
        rpsLine += rpsHeight >= i ? '█' : ' ';
      }
      chart += latencyLine + ' │ ' + rpsLine + '\n';
    }
  
    const bottomLine = '─'.repeat(leftPadding) + '┴' + '─'.repeat(width) + '┼' + '─'.repeat(leftPadding + 1) + '┴' + '─'.repeat(width);
    chart += bottomLine + '\n';
  
    const timeLabels = ' '.repeat(leftPadding + 1) + '0s' + ' '.repeat(width - 5) + duration.toFixed(0) + 's';
    chart += timeLabels + ' │ ' + timeLabels + '\n';
  
    return chart;
  }
  
  module.exports = generateASCIIChart;