const { WebClient } = require('@slack/web-api');
const fs = require('fs');

const web = new WebClient(process.env.SLACK_BOT_TOKEN);
const channelId = process.env.SLACK_CHANNEL_ID;

(async () => {
  try {
    // Send summary message
    const summaryText = fs.readFileSync('summary.txt', 'utf-8');
    await web.chat.postMessage({
      channel: channelId,
      text: summaryText,
    });

    // Send Process chart as a snippet
    await web.files.uploadV2({
      channel_id: channelId,
      file: fs.createReadStream('process_chart.txt'),
      filename: 'process_chart.txt',
      title: 'Process Request Duration Chart',
      initial_comment: 'Process Request Duration Chart:',
    });

    // Send Finalize chart as a snippet
    await web.files.uploadV2({
      channel_id: channelId,
      file: fs.createReadStream('finalize_chart.txt'),
      filename: 'finalize_chart.txt',
      title: 'Finalize Request Duration Chart',
      initial_comment: 'Finalize Request Duration Chart:',
    });

    console.log('Messages and charts posted successfully to Slack');
  } catch (error) {
    console.error('Error:', error);
  }
})();