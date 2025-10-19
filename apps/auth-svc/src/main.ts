import { AuthModule } from './auth/auth.module';
import { DocumentBuilder } from '@nestjs/swagger';
import { NestApplicationBuilder, generateNestApplication } from '@backend-evolved/shared';

async function bootstrap() {
    await generateNestApplication(
        NestApplicationBuilder
            .forModule(AuthModule)
            .setName('Authentication Service')
            .setPort(process.env.DEV_AUTH_SERVICE_PORT || '3000')
            .setQueueName('auth_queue')
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
                    .addServer(`https://questnutri.com.br/api/v1/auth`)
                    .addServer(`${process.env.DEV_GATEWAY_URL ?? `http://localhost:${process.env.DEV_GATEWAY_PORT ?? '8080'}`}/api/v1/auth`),
                {
                    url: 'docs'
                }
            )
    );
}

bootstrap();
