import { Module } from '@nestjs/common';
import { TacoModule } from '../taco/taco.module';

@Module({
    imports: [
        TacoModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
