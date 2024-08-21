#!/bin/bash

# Run k6 test and save output to JSON file
k6 run --out json=k6-results.json k6_script.js

# Generate charts and Slack message
node generateK6Charts.js

# Send message to Slack
node sendToSlack.js
