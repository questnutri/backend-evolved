import { AuthModule } from './auth/auth.module';
import { DocumentBuilder } from '@nestjs/swagger';
import { NestApplicationBuilder, generateNestApplication } from '@backend-evolved/shared';

async function bootstrap() {
    await generateNestApplication(
        NestApplicationBuilder
            .forModule(AuthModule)
            .setName('Authentication Service')
            .setPort(process.env.AUTH_SERVICE_PORT ?? '3000')
            .setQueueName(process.env.AUTH_QUEUE_NAME ?? 'auth_queue')
            .setPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            })
            .setSwagger(
                new DocumentBuilder()
                    .setTitle('Authentication Service API')
                    .setDescription('API documentation for the Authentication Service of QuestNutri')
                    .setVersion('1.0')
                    .addServer(`${process.env.GATEWAY_URL ?? `http://localhost:${process.env.GATEWAY_PORT ?? '8080'}`}/api/v1`),
                {
                    url: 'auth/docs'
                }
            )
    );
}

bootstrap();
