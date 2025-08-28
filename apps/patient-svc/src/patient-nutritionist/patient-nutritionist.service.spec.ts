import { Test, TestingModule } from '@nestjs/testing';
import { PatientNutritionistService } from './patient-nutritionist.service';

describe('PatientNutritionistService', () => {
  let service: PatientNutritionistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientNutritionistService],
    }).compile();

    service = module.get<PatientNutritionistService>(PatientNutritionistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
