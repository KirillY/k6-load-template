# K6 Load Testing Setup

This project contains scripts for running K6 load tests and generating summary reports and charts.

## Dependencies

- Node.js (v14 or later)
- K6 (https://k6.io/docs/getting-started/installation/)
- npm packages:
  - @slack/web-api
  - child_process
  - fs

To install the required npm packages, run:

```bash
npm install @slack/web-api
```

## Environment Variables

Set the following environment variables:

- `SLACK_BOT_TOKEN`: Your Slack bot token for sending reports
- `SLACK_CHANNEL_ID`: The ID of the Slack channel where reports will be sent

You can set these in a `.env` file or export them in your terminal:

```bash
export SLACK_BOT_TOKEN=your_token_here
export SLACK_CHANNEL_ID=your_channel_id_here
```

## Main File Options

The main file `k6_main.js` accepts one optional command-line argument:

- `scenario`: The test scenario to run (default: 'load')

## Running the Scripts

Follow these steps to run the load tests and generate reports:

1. Ensure K6 is installed and the environment variables are set.

2. Place all script files in the same directory:
   - k6_main.js
   - k6RunTests.mjs
   - K6ResultsParser.js
   - generateASCIIChart.js
   - generateSummary.js

3. Run the main script:

```bash
node k6_main.js [scenario]
```

Replace `[scenario]` with your desired scenario name, or omit it to use the default 'load' scenario.

4. The script will perform the following actions:
   - Run K6 tests
   - Generate a JSON file with test results (`k6-results.json`)
   - Parse the results
   - Generate a summary report
   - Create ASCII charts for Process and Finalize request durations
   - Print the summary and charts to the console
   - Send the summary and charts to Slack (if credentials are provided)

## Debugging

For debugging purposes, the script generates several files:

- `k6-results.json`: Raw K6 test results
- `process_chart.txt`: ASCII chart for Process request durations
- `finalize_chart.txt`: ASCII chart for Finalize request durations

You can examine these files after running the tests to get more detailed information about the test results.

## Customizing Tests

To modify the K6 test scenarios, edit the `k6RunTests.mjs` file. Refer to the K6 documentation (https://k6.io/docs/) for more information on how to structure and customize your load tests.

## Troubleshooting

If you encounter any issues:

1. Check that all required files are in the same directory.
2. Ensure environment variables are correctly set.
3. Verify that K6 is installed and accessible from the command line.
4. Check the console output for any error messages.

If problems persist, examine the generated JSON and text files for any unexpected data or formats.