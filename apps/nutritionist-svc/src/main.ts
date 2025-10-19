import { NutritionistModule } from './nutritionist/nutritionist.module';
import { DocumentBuilder } from '@nestjs/swagger';
import { ControllerExceptionFilter, NestApplicationBuilder, generateNestApplication } from '@backend-evolved/shared';


async function bootstrap() {
    await generateNestApplication(
        NestApplicationBuilder
            .forModule(NutritionistModule)
            .setName('Nutritionist Service')
            .setPort(process.env.DEV_NUTRITIONIST_SERVICE_PORT ?? '3000')
            .setQueueName('nutritionist_queue')
            .setPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            })
            .addExceptionFilter(new ControllerExceptionFilter())
            .setSwagger(
                new DocumentBuilder()
                    .setTitle('Nutritionist Service API')
                    .setDescription('API documentation for the Nutritionist service')
                    .setVersion('1.0')
                    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
                    .addServer(`https://questnutri.com.br/api/v1/nutritionist`)
                    .addServer(`${process.env.DEV_GATEWAY_URL ?? `http://localhost:${process.env.DEV_GATEWAY_PORT ?? '8080'}`}/api/v1/nutritionist`),
                {
                    url: 'docs'
                }
            )
    );

}

bootstrap();
