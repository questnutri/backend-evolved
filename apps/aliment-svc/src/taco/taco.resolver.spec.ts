import { Test, TestingModule } from '@nestjs/testing';
import { TacoResolver } from './taco.resolver';
import { TacoService } from './taco.service';

describe('TacoResolver', () => {
  let resolver: TacoResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TacoResolver, TacoService],
    }).compile();

    resolver = module.get<TacoResolver>(TacoResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
