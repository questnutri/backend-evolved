import { Test, TestingModule } from '@nestjs/testing';
import { PatientNutritionistController } from './patient-nutritionist.controller';
import { PatientNutritionistService } from './patient-nutritionist.service';

describe('PatientNutritionistController', () => {
  let controller: PatientNutritionistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientNutritionistController],
      providers: [PatientNutritionistService],
    }).compile();

    controller = module.get<PatientNutritionistController>(PatientNutritionistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
