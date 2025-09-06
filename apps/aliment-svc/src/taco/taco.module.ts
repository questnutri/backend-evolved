import { Module } from '@nestjs/common';
import { TacoService } from './taco.service';
import { TacoResolver } from './taco.resolver';
import { dbConnection } from '../database/provide-db';
import { TacoController } from './taco.controller';

@Module({
	imports: [
		dbConnection()
	],
	providers: [TacoService, TacoController],
})
export class TacoModule { }
