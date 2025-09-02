import { Test, TestingModule } from '@nestjs/testing';
import { TacoService } from './taco.service';

describe('TacoService', () => {
  let service: TacoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TacoService],
    }).compile();

    service = module.get<TacoService>(TacoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
