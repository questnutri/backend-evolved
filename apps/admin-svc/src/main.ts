import { 
    NestApplicationBuilder,
    generateNestApplication,
    provideJaegerTracing
} from '@backend-evolved/shared';
import { AdminModule } from './admin/admin.module';
import { DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    await generateNestApplication(
        NestApplicationBuilder
            .forModule(AdminModule)
            .setServiceName('Admin Service')
            .setJaeger('admin-svc')
            .setPort(process.env.DEV_ADMIN_SERVICE_PORT || '3000')
            .setPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            })
            .setQueueName('admin-queue')
            .setSwagger(
                new DocumentBuilder()
                    .setTitle('Admin Service')
                    .setDescription('The Admin Service API description')
                    .setVersion('1.0')
                    .addServer(`https://questnutri.com.br/api/v1/admin`)
                    .addServer(`${process.env.DEV_GATEWAY_URL ?? `http://localhost:${process.env.DEV_GATEWAY_PORT ?? '8080'}`}/api/v1/admin`),
                    {
                        url: 'docs'
                    }
            )
    );
}

bootstrap();
