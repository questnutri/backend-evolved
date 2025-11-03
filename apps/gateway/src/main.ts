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

    app.getHttpAdapter().get('/', (req, res) => {
        res.redirect('/api/v1/health');
    });

    // app.getHttpAdapter().get('/api/v1', (req, res) => {
    //     const protocol = req.protocol ?? 'http';
    //     const host = req.headers.host;
    //     res.redirect(`${protocol}://${host}/api/v1/health`);
    // });

    const PORT = process.env.DEV_GATEWAY_PORT ?? 8080;
    await app.listen(PORT, "::");
    Logger.log(`🚀 Gateway is running on: http://localhost:${PORT}/${globalPrefix}`);
}

bootstrap();
