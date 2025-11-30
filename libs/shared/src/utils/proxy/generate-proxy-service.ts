import { ClientProxyFactory, Transport } from '@nestjs/microservices';

export const generateProxyServiceProvider = (providerName: string, queue: string) => {
    return {
        provide: providerName,
        useFactory: () => {
            return ClientProxyFactory.create({
                transport: Transport.RMQ,
                options: {
                    urls: [process.env.DEV_RABBITMQ_URL || 'amqp://rabbitmq:5672'],
                    queue,
                    queueOptions: { durable: true },
                },
            });
        }
    }
} 
