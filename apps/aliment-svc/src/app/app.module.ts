import { Module } from '@nestjs/common';
import { TacoController } from '../taco/taco.controller';
import { TacoService } from '../taco/taco.service';
import { dbConnection } from '../database/db-connection';
import { GraphqlModule } from '../graphql/graphql.module';
import { HomeMeasureController } from '../home-measure/home-measure.controller';
import { HomeMeasureService } from '../home-measure/home-measure.service';
import { AlimentController } from '../aliment/aliment.controller';
import { SecretAlimentService } from '../secret-aliment/secret-aliment.service';
import { AlimentBaseService } from '../aliment/aliment-base.service';

@Module({
    imports: [
        // TacoModule,
        dbConnection(),
        GraphqlModule
    ],
    controllers: [TacoController, HomeMeasureController, AlimentController],
    providers: [TacoService, HomeMeasureService, SecretAlimentService],
})
export class AppModule { }
