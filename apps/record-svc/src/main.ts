import { NestApplicationBuilder, generateNestApplication, ControllerExceptionFilter } from '@backend-evolved/shared';
import { DocumentBuilder } from '@nestjs/swagger';
import { ServiceModule } from './service/service.module';

async function bootstrap() {
    await generateNestApplication(
        NestApplicationBuilder
            .forModule(ServiceModule)
            .setName('Record Service')
            .setPort(process.env.DEV_RECORD_SERVICE_PORT ?? '3000')
            .setQueueName('record_queue')
            .setPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            })
            // .setGlobalPrefix('record')
            .addExceptionFilter(new ControllerExceptionFilter())
            .setSwagger(
                new DocumentBuilder()
                    .setTitle('Record Service API')
                    .setDescription('API documentation for the Record Service of QuestNutri')
                    .setVersion('1.0')
                    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
                    .addServer(`https://questnutri.com.br/api/v1/record`)
                    .addServer(`${process.env.DEV_GATEWAY_URL ?? `http://localhost:${process.env.DEV_GATEWAY_PORT ?? '8080'}`}/api/v1/record`),
                {
                    url: 'docs'
                }
            )
    );
}

bootstrap();
