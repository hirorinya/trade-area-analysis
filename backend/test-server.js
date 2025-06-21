const express = require('express');
const app = express();
const PORT = 8001;

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Express 4.x working!' });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
});