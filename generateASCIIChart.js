function generateASCIIChart(data, timestamps, title, width = 30, height = 20) {
    if (data.length === 0 || timestamps.length === 0) {
      return `No data available for ${title}`;
    }
  
    const startTime = new Date(Math.min(...timestamps));
    const endTime = new Date(Math.max(...timestamps));
    const duration = (endTime - startTime) / 1000; // duration in seconds
  
    // Calculate requests per second
    const timeSlices = new Array(width).fill(0);
    data.forEach((_, index) => {
      const sliceIndex = Math.floor((timestamps[index] - startTime) / (duration * 1000 / width));
      if (sliceIndex >= 0 && sliceIndex < width) {
        timeSlices[sliceIndex]++;
      }
    });
    const rpsData = timeSlices.map(count => count / (duration / width));
  
    // Scale the data to fit the height
    const minLatency = Math.min(...data);
    const maxLatency = Math.max(...data);
    const minRps = Math.min(...rpsData);
    const maxRps = Math.max(...rpsData);
  
    const scaleLatency = (value) => Math.floor((value - minLatency) / (maxLatency - minLatency) * (height - 1));
    const scaleRps = (value) => Math.floor((value - minRps) / (maxRps - minRps) * (height - 1));
  
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
        const latencyHeight = scaleLatency(data[Math.floor(j * data.length / width)]);
        const rpsHeight = scaleRps(rpsData[j]);
  
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