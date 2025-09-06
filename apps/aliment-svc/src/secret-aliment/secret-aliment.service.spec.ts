import { Test, TestingModule } from '@nestjs/testing';
import { SecretAlimentService } from './secret-aliment.service';

describe('SecretAlimentService', () => {
  let service: SecretAlimentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecretAlimentService],
    }).compile();

    service = module.get<SecretAlimentService>(SecretAlimentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
