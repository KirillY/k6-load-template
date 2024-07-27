const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/process', (req, res) => {
  // Check if this is a smoke test request
  if (req.body.data === 'smoke_test') {
    // Simulate a failure for the smoke test
    return res.status(500).json({ error: 'Smoke test failure' });
  }

  const processingTime = Math.floor(Math.random() * (15000 - 5000 + 1) + 5000);
  setTimeout(() => {
    const result = { processedData: req.body.data + '_processed' };
    res.json(result);
  }, processingTime);
});

app.post('/finalize', (req, res) => {
  const processingTime = Math.floor(Math.random() * (15000 - 5000 + 1) + 5000);
  setTimeout(() => {
    const result = { finalResult: req.body.processedData + '_finalized' };
    res.json(result);
  }, processingTime);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
