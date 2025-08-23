import { NutritionistModule } from './nutritionist/nutritionist.module';
import { DocumentBuilder } from '@nestjs/swagger';
import { NestApplicationBuilder, generateNestApplication, } from '@backend-evolved/shared';


async function bootstrap() {
    await generateNestApplication(
        NestApplicationBuilder
            .forModule(NutritionistModule)
            .setName('Nutritionist Service')
            .setPort(process.env.NUTRITIONIST_SERVICE_PORT ?? '3033')
            .setQueueName(process.env.NUTRITIONIST_QUEUE_NAME ?? 'nutritionist_queue')
            .setPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            })
            .setSwagger(
                new DocumentBuilder()
                    .setTitle('Nutritionist Service API')
                    .setDescription('API documentation for the Nutritionist service')
                    .setVersion('1.0')
                    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
                    .addServer(`${process.env.GATEWAY_URL ?? `http://localhost:${process.env.GATEWAY_PORT ?? '8080'}`}/api/v1`),
                {
                    url: 'nutritionist/docs'
                }
            )
    );
}

bootstrap();
