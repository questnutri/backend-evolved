import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MealRecordService } from './meal-record.service';
import { MealRecord } from '@backend-evolved/shared';
import { Repository } from 'typeorm';

describe('MealRecordService', () => {
  let service: MealRecordService;
  let repository: Repository<MealRecord>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealRecordService,
        {
          provide: getRepositoryToken(MealRecord),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: 'DIET_SERVICE_PROXY',
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MealRecordService>(MealRecordService);
    repository = module.get<Repository<MealRecord>>(getRepositoryToken(MealRecord));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
