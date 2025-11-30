import { 
    NestApplicationBuilder,
    generateNestApplication
} from '@backend-evolved/shared';
import { NotificationModule } from './notification/notification.module';
import { DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    await generateNestApplication(
        NestApplicationBuilder
            .forModule(NotificationModule)
            .setServiceName('Notification Service')
            .setJaeger('notification-svc')
            .setPort(process.env.DEV_NOTIFICATION_SERVICE_PORT ?? '3000')
            .setQueueName('notification_queue')
            .setPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            })
            .setSwagger(
                new DocumentBuilder()
                    .setTitle('Notification Service API')
                    .setDescription('API documentation for the Notification Service of QuestNutri')
                    .setVersion('1.0')
                    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
                    .addServer(`https://questnutri.com.br/api/v1/notification`)
                    .addServer(`${process.env.DEV_GATEWAY_URL ?? `http://localhost:${process.env.DEV_GATEWAY_PORT ?? '8080'}`}/api/v1/notification`),
                {
                    url: 'docs'
                }
            )
    );
}

bootstrap();