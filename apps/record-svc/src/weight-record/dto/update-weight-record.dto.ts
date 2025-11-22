import { PartialType } from '@nestjs/mapped-types';
import { CreateWeightRecordDto } from './create-weight-record.dto';

export class UpdateWeightRecordDto extends PartialType(CreateWeightRecordDto) {}
