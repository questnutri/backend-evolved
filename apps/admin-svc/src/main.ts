import { NestApplicationBuilder, generateNestApplication } from '@backend-evolved/shared';
import { AdminModule } from './admin/admin.module';
import { DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    await generateNestApplication(
        NestApplicationBuilder
            .forModule(AdminModule)
            .setName('Admin Service')
            .setPort(process.env.ADMIN_SERVICE_PORT ?? '3030')
            .setPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            })
            .setQueueName(process.env.ADMIN_QUEUE_NAME ?? 'admin-queue')
            .setSwagger(
                new DocumentBuilder()
                    .setTitle('Admin Service')
                    .setDescription('The Admin Service API description')
                    .setVersion('1.0')
                    .addServer(`${process.env.GATEWAY_URL ?? `http://localhost:${process.env.GATEWAY_PORT ?? '8080'}`}/api/v1`),
                    {
                        url: '/admin/docs'
                    }
            )
    );
}

bootstrap();
