import { Module } from '@nestjs/common';
import { SecretAlimentService } from './secret-aliment.service';
import { SecretAlimentController } from './secret-aliment.controller';

@Module({
  controllers: [SecretAlimentController],
  providers: [SecretAlimentService],
})
export class SecretAlimentModule {}
