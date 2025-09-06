import { Module } from '@nestjs/common';
import { TacoController } from '../taco/taco.controller';
import { TacoService } from '../taco/taco.service';
import { dbConnection } from '../database/provide-db';
import { GraphqlModule } from '../graphql/graphql.module';
import { HomeMeasureController } from '../home-measure/home-measure.controller';
import { HomeMeasureService } from '../home-measure/home-measure.service';

@Module({
    imports: [
        // TacoModule,
        dbConnection(),
        GraphqlModule
    ],
    controllers: [TacoController, HomeMeasureController],
    providers: [TacoService, HomeMeasureService],
})
export class AppModule { }
