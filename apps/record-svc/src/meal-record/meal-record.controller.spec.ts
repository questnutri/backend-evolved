import { Test, TestingModule } from '@nestjs/testing';
import { MealRecordController } from './meal-record.controller';
import { MealRecordService } from './meal-record.service';

describe('MealRecordController', () => {
  let controller: MealRecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealRecordController],
      providers: [
        {
          provide: MealRecordService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            createPatientMealRecord: jest.fn(),
            updateOne: jest.fn(),
            markAsCompleted: jest.fn(),
            markAsIncomplete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MealRecordController>(MealRecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
