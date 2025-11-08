import { NodeSDK } from '@opentelemetry/sdk-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

export const provideJaegerTracing = (config: { serviceName: string; endpoint?: string | undefined }) => {
  const defaultValues = {
    serviceName: 'unknown-service',
    endpoint: 'http://jaeger-service:4318'
  }

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.serviceName || defaultValues.serviceName
  })

  const sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({
      url: `${config.endpoint || defaultValues.endpoint}/v1/traces`
    }),
    instrumentations: [getNodeAutoInstrumentations()]
  })

  return {
    provide: 'JAEGER_TRACING',
    useFactory: async () => {
      await sdk.start()
      process.on('SIGTERM', async () => {
        await sdk.shutdown()
        process.exit(0)
      })
      process.on('SIGINT', async () => {
        await sdk.shutdown()
        process.exit(0)
      })
      return sdk
    }
  }
}
