require('./instrumentation');
 
const express = require('express');
const { logs } = require('@opentelemetry/api-logs');
const { SeverityNumber } = require('@opentelemetry/api-logs');
 
const app = express();
const logger = logs.getLogger('express-demo');
const PORT = 3000; 
// Helper to emit OTel logs
function log(message, severity = SeverityNumber.INFO) {
  logger.emit({
    severityNumber: severity,
    severityText: severity === SeverityNumber.ERROR ? 'ERROR' : 'INFO',
    body: message,
    attributes: { 'service.name': 'express-demo' },
  });
  console.log(message); // still print to stdout
}
 
app.get('/', (req, res) => {
  log('Handling GET /');
  res.json({ message: 'Hello from OTel-instrumented Express!' });
});
 
app.get('/work', async (req, res) => {
  await new Promise(r => setTimeout(r, Math.random() * 200));
  log('Handling GET /work');
    res.json({
    status: 'done',
    flux_test: 'VERSION_1'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  log(`Server running on port ${PORT}`);
});
