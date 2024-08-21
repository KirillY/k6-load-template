const { WebClient } = require('@slack/web-api');
const fs = require('fs');

const web = new WebClient(process.env.SLACK_BOT_TOKEN);

(async () => {
  try {
    const messageContent = fs.readFileSync('slack_message.txt', 'utf-8');
    
    await web.chat.postMessage({
      channel: 'whatever',
      text: messageContent,
    });

    console.log('Message posted successfully to Slack');
  } catch (error) {
    console.error('Error:', error);
  }
})();