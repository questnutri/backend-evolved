import { NestApplicationBuilder, generateNestApplication } from '@backend-evolved/shared';
import { DocumentBuilder } from '@nestjs/swagger';
import { ServiceModule } from './service/service.module';

async function bootstrap() {
    await generateNestApplication(
        NestApplicationBuilder
            .forModule(ServiceModule)
            .setServiceName('Patient Service')
            .setJaeger('patient-svc')
            .setPort(process.env.DEV_PATIENT_SERVICE_PORT ?? '3000')
            .setQueueName('patient_queue')
            .setPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            })
            .setSwagger(
                new DocumentBuilder()
                    .setTitle('Patient Service')
                    .setDescription('API documentation for the Patient service')
                    .setVersion('1.0')
                    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
                    .addServer(`https://questnutri.com.br/api/v1/patient`)
                    .addServer(`${process.env.DEV_GATEWAY_URL ?? `http://localhost:${process.env.DEV_GATEWAY_PORT ?? '8080'}`}/api/v1/patient`),
                {
                    url: 'docs',
                }
            )
    );
    console.log(`Patient service updated!`);
}

bootstrap();
