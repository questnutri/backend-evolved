import { Module } from '@nestjs/common';
import { HomeMeasureService } from './home-measure.service';
import { HomeMeasureController } from './home-measure.controller';
import { dbConnection } from '../database/provide-db';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [HomeMeasureController],
    providers: [HomeMeasureService],
})
export class HomeMeasureModule { }
