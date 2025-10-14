import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway/gateway.module';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(GatewayModule, { bodyParser: false });
    app.use(helmet());
    app.enableCors();

    (app as any).set('trust proxy', 1);
    const globalPrefix = 'api/v1';

    app.setGlobalPrefix(globalPrefix);
    const PORT = process.env.DEV_GATEWAY_PORT ?? 8080;
    await app.listen(PORT, "::");
    Logger.log(`🚀 Gateway is running on: http://localhost:${PORT}/${globalPrefix}`);
}

bootstrap();
