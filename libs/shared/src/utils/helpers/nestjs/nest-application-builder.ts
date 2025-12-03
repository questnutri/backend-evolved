import {
    DynamicModule,
    ExceptionFilter,
    ForwardReference,
    Logger,
    NestApplicationOptions,
    Type,
    ValidationPipe,
    ValidationPipeOptions
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { provideRabbitMqConnection, provideJaegerTracing } from '../../providers';
type IEntryNestModule = Type<any> | DynamicModule | ForwardReference | Promise<IEntryNestModule>;

export class NestApplicationBuilder {
    private module: IEntryNestModule;
    private nestAppOptions: NestApplicationOptions | undefined;
    private rabbitMqQueue: string | undefined;
    private swaggerConfig: DocumentBuilder | undefined;
    private swaggerApiUrl: string = '/api';
    private pipeOptions: ValidationPipeOptions | undefined;
    private servicePort: number = 3000;
    private serviceName: string = 'Application';
    private exceptionFilters: ExceptionFilter[] = [];
    private globalPrefix: string | undefined;
    private jaegerServiceName: string | undefined;


    private constructor(module: IEntryNestModule, options?: NestApplicationOptions) {
        this.module = module;
        this.nestAppOptions = options;
    }

    static forModule(module: IEntryNestModule, options?: NestApplicationOptions): NestApplicationBuilder {
        return new NestApplicationBuilder(module, options);
    }

    setServiceName(name: string): NestApplicationBuilder {
        this.serviceName = name;
        return this;
    }

    setJaeger(name: string) {
        this.jaegerServiceName = name;
        return this;
    }

    setPort(port: string): NestApplicationBuilder {
        this.servicePort = Number(port);
        return this;
    }

    setGlobalPrefix(prefix: string): NestApplicationBuilder {
        this.globalPrefix = prefix;
        return this;
    }

    setSwagger(swagger: DocumentBuilder, options: { url: string } = { url: '/api' }): NestApplicationBuilder {
        this.swaggerConfig = swagger;
        this.swaggerApiUrl = options.url;
        return this;
    }

    setQueueName(queue: string): NestApplicationBuilder {
        this.rabbitMqQueue = queue;
        return this;
    }

    setPipe(options: ValidationPipeOptions): NestApplicationBuilder {
        this.pipeOptions = options;
        return this;
    }

    addExceptionFilter(filter: ExceptionFilter): NestApplicationBuilder {
        this.exceptionFilters.push(filter);
        return this;
    }

    async listen() {
        const app = await this.getApp();
        await app.listen(this.servicePort);
        const prefixPath = this.globalPrefix ? `/${this.globalPrefix}` : '';
        Logger.log(`🚀 ${this.serviceName} is running on: http://localhost:${this.servicePort}${prefixPath}`);
        return app;
    }

    async getApp() {
        if(this.jaegerServiceName) {
            const jaeger = provideJaegerTracing({
                serviceName: this.jaegerServiceName,
                endpoint: process.env.JAEGER_ENDPOINT,
            });
            jaeger.useFactory();
        }

        const app = await NestFactory.create(this.module, this.nestAppOptions);

        if (this.globalPrefix) {
            app.setGlobalPrefix(this.globalPrefix);
        }

        if (this.swaggerConfig) {
            const swagger = this.swaggerConfig.build();
            const documentFactory = () => SwaggerModule.createDocument(app, swagger);
            SwaggerModule.setup(this.swaggerApiUrl, app, documentFactory());
        }
        if (this.pipeOptions) {
            app.useGlobalPipes(new ValidationPipe(this.pipeOptions));
        }

        if (this.rabbitMqQueue) {
            app.connectMicroservice<MicroserviceOptions>(
                provideRabbitMqConnection(
                    this.rabbitMqQueue
                )
            );

            await app.startAllMicroservices();
        }

        return app;
    }
}