import { PartialType } from '@nestjs/mapped-types';
import { Dto_CreateWaterRecord } from './create-water-record.dto';

export class UpdateWaterRecordDto extends PartialType(Dto_CreateWaterRecord) {}
