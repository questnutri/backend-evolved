import { 
    NestApplicationBuilder,
    generateNestApplication
} from '@backend-evolved/shared';
import { AppModule } from './app/app.module';

async function bootstrap() {
    await generateNestApplication(
        NestApplicationBuilder
            .forModule(AppModule)
            .setServiceName('Game Service')
            .setJaeger('game-svc')
            .setPort(process.env.DEV_GAME_SERVICE_PORT ?? '3000')
            .setQueueName('game_queue')
            .setPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            })
            // .setSwagger(
            //     new DocumentBuilder()
            //         .setTitle('Record Service API')
            //         .setDescription('API documentation for the Record Service of QuestNutri')
            //         .setVersion('1.0')
            //         .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
            //         .addServer(`https://questnutri.com.br/api/v1/record`)
            //         .addServer(`${process.env.DEV_GATEWAY_URL ?? `http://localhost:${process.env.DEV_GATEWAY_PORT ?? '8080'}`}/api/v1/record`),
            //     {
            //         url: 'docs'
            //     }
            // )
    );
}

bootstrap();