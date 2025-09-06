import { Test, TestingModule } from '@nestjs/testing';
import { SecretAlimentController } from './secret-aliment.controller';
import { SecretAlimentService } from './secret-aliment.service';

describe('SecretAlimentController', () => {
  let controller: SecretAlimentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecretAlimentController],
      providers: [SecretAlimentService],
    }).compile();

    controller = module.get<SecretAlimentController>(SecretAlimentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
