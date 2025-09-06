import { Resolver, Query } from '@nestjs/graphql';
import { TacoAliment } from '../../../../libs/shared/src/entities/aliment/taco-aliment.entity';
import { TacoService } from './taco.service';

@Resolver(() => TacoAliment)
export class TacoResolver {
    constructor(private readonly tacoService: TacoService) { }

    @Query(() => [TacoAliment], { name: 'tacoAliments' })
    async getTacoAliments() {
        return this.tacoService.findAll();
    }
}
