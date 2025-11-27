import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ListenerModule } from '../listener/listener.module';
import { dbConnection } from '../database/db-connection';

@Module({
    imports: [
        dbConnection(),
        ListenerModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
