/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import { generateNestApplication, NestApplicationBuilder } from "@backend-evolved/shared";
import { DocumentBuilder } from '@nestjs/swagger';
import { ServiceModule } from "./service/service.module";

async function bootstrap() {
	const app = await generateNestApplication(
		NestApplicationBuilder.forModule(ServiceModule)
			.setName("Diet Service")
			.setPort(process.env.DIET_SERVICE_PORT || '3035')
			.setQueueName(process.env.DIET_SERVICE_QUEUE || 'diet_queue')
			.setPipe({
				whitelist: true,
				forbidNonWhitelisted: false,
				transform: true,
			})
			.setSwagger(
				new DocumentBuilder()
					.setTitle('Diet Service')
					.setDescription('API documentation for the Diet Service')
					.setVersion('1.0')
					.addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
					.addServer(`${process.env.GATEWAY_URL ?? `http://localhost:${process.env.GATEWAY_PORT ?? '8080'}`}/api/v1`),
				{
					url: 'diet/docs'
				}
			)
	)
}
bootstrap();
