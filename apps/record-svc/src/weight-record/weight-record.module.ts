import { Module } from '@nestjs/common';
import { WeightRecordService } from './weight-record.service';
import { WeightRecordRestController } from './controllers/weight-record.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeightRecord } from '@backend-evolved/shared';

@Module({
    imports: [
        TypeOrmModule.forFeature([WeightRecord])
    ],
    controllers: [WeightRecordRestController],
    providers: [WeightRecordService],
})
export class WeightRecordModule { }