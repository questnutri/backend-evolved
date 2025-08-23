import { Test, TestingModule } from '@nestjs/testing';
import { NutritionistService } from './nutritionist.service';

describe('NutritionistService', () => {
  let service: NutritionistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NutritionistService],
    }).compile();

    service = module.get<NutritionistService>(NutritionistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
