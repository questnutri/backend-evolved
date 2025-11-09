import { generateNestApplication, NestApplicationBuilder } from "@backend-evolved/shared";
import { DocumentBuilder } from '@nestjs/swagger';
import { ServiceModule } from "./service/service.module";

async function bootstrap() {
	await generateNestApplication(
		NestApplicationBuilder.forModule(ServiceModule)
			.setServiceName("Diet Service")
			.setJaeger('diet-svc')
			.setPort(process.env.DEV_DIET_SERVICE_PORT || '3000')
			.setQueueName('diet_queue')
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
					.addServer(`https://questnutri.com.br/api/v1/diet`)
					.addServer(`${process.env.DEV_GATEWAY_URL ?? `http://localhost:${process.env.DEV_GATEWAY_PORT ?? '8080'}`}/api/v1/diet`),
				{
					url: 'docs'
				}
			)
	)
}
bootstrap();