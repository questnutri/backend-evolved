import { generateNestApplication, NestApplicationBuilder } from "@backend-evolved/shared";
import { AppModule } from "./app/app.module";

async function bootstrap() {
	await generateNestApplication(
		NestApplicationBuilder.forModule(AppModule)
			.setName("Aliment Service")
			.setPort(process.env.ALIMENT_SERVICE_PORT || '3000')
			.setQueueName(process.env.ALIMENT_SERVICE_QUEUE || 'aliment_queue')
			.setPipe({
				whitelist: true,
				forbidNonWhitelisted: false,
				transform: true,
			})
	)
}

bootstrap();
