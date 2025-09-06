import { Test, TestingModule } from '@nestjs/testing';
import { HomeMeasureController } from './home-measure.controller';
import { HomeMeasureService } from './home-measure.service';

describe('HomeMeasureController', () => {
  let controller: HomeMeasureController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeMeasureController],
      providers: [HomeMeasureService],
    }).compile();

    controller = module.get<HomeMeasureController>(HomeMeasureController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
