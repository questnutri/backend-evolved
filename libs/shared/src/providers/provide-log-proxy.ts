import { ClientProxyFactory, ClientOptions, ClientProxy } from "@nestjs/microservices";
import { provideRabbitMqConnection } from "../utils";

export const provideLogProxy = () => {
    return new LogProxy();
}

class LogProxy {
    gameService: ClientProxy;
    logService: ClientProxy;

    constructor() {
        this.gameService = ClientProxyFactory.create(
            provideRabbitMqConnection('game_queue') as ClientOptions
        );
        this.logService = ClientProxyFactory.create(
            provideRabbitMqConnection('log_queue') as ClientOptions
        )
    }

    emit<TResult = any, TInput = any>(pattern: any, data: TInput) {
        this.gameService.emit(pattern, data);
        this.logService.emit(pattern, data);
    }
}