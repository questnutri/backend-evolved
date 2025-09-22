import { generateNestApplication, NestApplicationBuilder } from "@backend-evolved/shared";
import { AppModule } from "./app/app.module";

async function bootstrap() {
	await generateNestApplication(
		NestApplicationBuilder.forModule(AppModule)
			.setName("Aliment Service")
			.setPort(process.env.DEV_ALIMENT_SERVICE_PORT || '3000')
			.setQueueName('aliment_queue')
			.setPipe({
				whitelist: true,
				forbidNonWhitelisted: false,
				transform: true,
			})
	)
}

bootstrap();
