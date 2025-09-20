import { Transport, MicroserviceOptions} from '@nestjs/microservices';

export const provideRabbitMqConnection = (queue: string): MicroserviceOptions => {
    return {
        transport: Transport.RMQ,
        options: {
            urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@rabbitmq:5672'],
            queue,
            queueOptions: { durable: true },
        },
    }
};