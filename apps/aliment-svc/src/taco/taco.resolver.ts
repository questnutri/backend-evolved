import { Resolver } from '@nestjs/graphql';
import { TacoService } from './taco.service';

@Resolver('Taco')
export class TacoResolver {
  constructor(private readonly tacoService: TacoService) {}
}
