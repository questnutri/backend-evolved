import { Test, TestingModule } from '@nestjs/testing';
import { PatientRestController } from './patient-rest.controller';
import { PatientService } from './patient.service';

describe('PatientController', () => {
  let controller: PatientRestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientRestController],
      providers: [PatientService],
    }).compile();

    controller = module.get<PatientRestController>(PatientRestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
