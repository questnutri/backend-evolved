import { NestApplicationBuilder, generateNestApplication } from '@backend-evolved/shared';
import { PatientModule } from './patient/patient.module';
import { DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    await generateNestApplication(
        NestApplicationBuilder
            .forModule(PatientModule)
            .setName('Patient Service')
            .setPort(process.env.PATIENT_SERVICE_PORT ?? '3034')
            .setQueueName(process.env.PATIENT_QUEUE_NAME ?? 'patient-queue')
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
                    .addServer(`${process.env.GATEWAY_URL ?? `http://localhost:${process.env.GATEWAY_PORT ?? '8080'}`}/api/v1`),
                {
                    url: 'patient/docs',
                }
            )
    );
}

bootstrap();
