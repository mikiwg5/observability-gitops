const { NodeSDK } = require('@opentelemetry/sdk-node');

const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');

const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');

const {
LoggerProvider,
BatchLogRecordProcessor,
} = require('@opentelemetry/sdk-logs');

const { logs } = require('@opentelemetry/api-logs');

const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const { Resource } = require('@opentelemetry/resources');

const {
SEMRESATTRS_SERVICE_NAME,
} = require('@opentelemetry/semantic-conventions');

// -----------------------------------------------------------------------------
// Collector endpoint
// -----------------------------------------------------------------------------

const collectorEndpoint =
process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector-collector:4318';

// -----------------------------------------------------------------------------
// Resource definition
// -----------------------------------------------------------------------------

const resource = new Resource({
[SEMRESATTRS_SERVICE_NAME]: 'express-demo',
});

// -----------------------------------------------------------------------------
// LOGGING SETUP
// -----------------------------------------------------------------------------
//
// IMPORTANT:
// Your previous configuration created a BatchLogRecordProcessor inside NodeSDK,
// but didn't explicitly create/register a LoggerProvider.
//
// This section wires:
//
// app logger
//      ↓
// LoggerProvider
//      ↓
// OTLPLogExporter
//      ↓
// Collector /v1/logs
//
// -----------------------------------------------------------------------------

const logExporter = new OTLPLogExporter({
url: `${collectorEndpoint}/v1/logs`,
});

const loggerProvider = new LoggerProvider({
resource,
});

// IMPORTANT ADDITION
loggerProvider.addLogRecordProcessor(
new BatchLogRecordProcessor(logExporter)
);

// IMPORTANT ADDITION
logs.setGlobalLoggerProvider(loggerProvider);

// -----------------------------------------------------------------------------
// TRACE EXPORTER
// -----------------------------------------------------------------------------

const traceExporter = new OTLPTraceExporter({
url: `${collectorEndpoint}/v1/traces`,
});

// -----------------------------------------------------------------------------
// METRIC EXPORTER
// -----------------------------------------------------------------------------

const metricReader = new PeriodicExportingMetricReader({
exporter: new OTLPMetricExporter({
url: `${collectorEndpoint}/v1/metrics`,
}),
exportIntervalMillis: 5000,
});

// -----------------------------------------------------------------------------
// NODE SDK
// -----------------------------------------------------------------------------

const sdk = new NodeSDK({
resource,

traceExporter,

metricReader,

instrumentations: [
getNodeAutoInstrumentations({
'@opentelemetry/instrumentation-winston': {
enabled: true,
},

```
  '@opentelemetry/instrumentation-bunyan': {
    enabled: true,
  },

  // Optional:
  // Captures console.log() as logs in newer instrumentation packages.
  '@opentelemetry/instrumentation-console': {
    enabled: true,
  },
}),
```

],
});

// -----------------------------------------------------------------------------
// START SDK
// -----------------------------------------------------------------------------

sdk.start();

console.log('OpenTelemetry SDK started');

// -----------------------------------------------------------------------------
// SHUTDOWN
// -----------------------------------------------------------------------------

process.on('SIGTERM', async () => {
try {
await sdk.shutdown();
await loggerProvider.shutdown();
} catch (err) {
console.error('OTel shutdown error', err);
}
});

