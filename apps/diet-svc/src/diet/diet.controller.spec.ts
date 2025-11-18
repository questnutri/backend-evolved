import { Test, TestingModule } from '@nestjs/testing';
import { DietRestController } from './controllers/diet-rest.controller';
import { DietService } from './diet.service';

describe('DietController', () => {
  let controller: DietRestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DietRestController],
      providers: [DietService],
    }).compile();

    controller = module.get<DietRestController>(DietRestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
