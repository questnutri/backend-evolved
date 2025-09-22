import { generateProxyServiceProvider } from "./generate-proxy-service";
import * as PROXY_NAMES from "./providers-proxy-services-names";

export const provideProxyService = (serviceName: string) => {
    switch (serviceName) {
        case PROXY_NAMES.AUTH_SERVICE_PROXY_NAME:
            return generateProxyServiceProvider(
                PROXY_NAMES.AUTH_SERVICE_PROXY_NAME,
                process.env.DEV_AUTH_QUEUE_NAME || 'auth_queue'
            );
        case PROXY_NAMES.NUTRITIONIST_SERVICE_PROXY_NAME:
            return generateProxyServiceProvider(
                PROXY_NAMES.NUTRITIONIST_SERVICE_PROXY_NAME,
                process.env.DEV_NUTRITIONIST_QUEUE_NAME || 'nutritionist_queue'
            );
        case PROXY_NAMES.PATIENT_SERVICE_PROXY_NAME:
            return generateProxyServiceProvider(
                PROXY_NAMES.PATIENT_SERVICE_PROXY_NAME,
                process.env.DEV_PATIENT_QUEUE_NAME || 'patient_queue'
            );
        case PROXY_NAMES.ALIMENT_SERVICE_PROXY_NAME:
            return generateProxyServiceProvider(
                PROXY_NAMES.ALIMENT_SERVICE_PROXY_NAME,
                process.env.DEV_ALIMENT_QUEUE_NAME || 'aliment_queue'
            );
        case PROXY_NAMES.DIET_SERVICE_PROXY_NAME:
            return generateProxyServiceProvider(
                PROXY_NAMES.DIET_SERVICE_PROXY_NAME,
                process.env.DEV_DIET_QUEUE_NAME || 'diet_queue'
            );
        case PROXY_NAMES.RECORD_SERVICE_PROXY_NAME:
            return generateProxyServiceProvider(
                PROXY_NAMES.RECORD_SERVICE_PROXY_NAME,
                process.env.DEV_RECORD_QUEUE_NAME || 'record_queue'
            );
        default:
            throw new Error(`No proxy service provider found for service: ${serviceName}`);
    }
};