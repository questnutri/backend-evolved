import { Test, TestingModule } from '@nestjs/testing';
import { HomeMeasureService } from './home-measure.service';

describe('HomeMeasureService', () => {
  let service: HomeMeasureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HomeMeasureService],
    }).compile();

    service = module.get<HomeMeasureService>(HomeMeasureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
