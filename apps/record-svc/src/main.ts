import { NestApplicationBuilder, generateNestApplication, ControllerExceptionFilter } from '@backend-evolved/shared';
import { DocumentBuilder } from '@nestjs/swagger';
import { ServiceModule } from './service/service.module';

async function bootstrap() {
    await generateNestApplication(
        NestApplicationBuilder
            .forModule(ServiceModule)
            .setName('Record Service')
            .setPort(process.env.RECORD_SERVICE_PORT ?? '3037')
            .setQueueName(process.env.RECORD_QUEUE_NAME ?? 'record_queue')
            .setPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            })
            .setGlobalPrefix('record')
            .addExceptionFilter(new ControllerExceptionFilter())
            .setSwagger(
                new DocumentBuilder()
                    .setTitle('Record Service API')
                    .setDescription('API documentation for the Record Service of QuestNutri')
                    .setVersion('1.0')
                    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
                    .addServer(`${process.env.GATEWAY_URL ?? `http://localhost:${process.env.GATEWAY_PORT ?? '8080'}`}/api/v1`),
                {
                    url: 'record/docs'
                }
            )
    );
}

bootstrap();
