import { ClientProxyFactory, Transport } from '@nestjs/microservices';

export const generateProxyServiceProvider = (providerName: string, queue: string) => {
    return {
        provide: providerName,
        useFactory: () => {
            return ClientProxyFactory.create({
                transport: Transport.RMQ,
                options: {
                    urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
                    queue,
                    queueOptions: { durable: true },
                },
            });
        }
    }
} 
