import { Module } from '@nestjs/common';
import { TacoService } from './taco.service';
import { TacoResolver } from './taco.resolver';
import { dbConnection } from '../database/provide-db';

@Module({
	imports: [
		dbConnection()
	],
	providers: [TacoResolver, TacoService],
})
export class TacoModule { }
