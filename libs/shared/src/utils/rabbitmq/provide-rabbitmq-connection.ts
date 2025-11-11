import { Transport, MicroserviceOptions} from '@nestjs/microservices';

export const provideRabbitMqConnection = (queue: string): MicroserviceOptions => {
    return {
        transport: Transport.RMQ,
        options: {
            urls: [process.env.DEV_RABBITMQ_URL || 'amqp://rabbitmq:5672'],
            queue,
            queueOptions: { durable: true },
        },
    }
};