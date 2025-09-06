import { Resolver, Query, Args } from '@nestjs/graphql';
import { Aliment, SecretAliment } from '@backend-evolved/shared';
import { TacoAliment } from '@backend-evolved/shared';
import { HomeMeasureAliment } from '@backend-evolved/shared';
import { TacoService } from '../taco/taco.service';
import { HomeMeasureService } from '../home-measure/home-measure.service';
import { AlimentSource } from '@backend-evolved/shared';
import { SecretAlimentService } from '../secret-aliment/secret-aliment.service';

@Resolver(() => Aliment)
export class AlimentResolver {
    constructor(
        private readonly tacoService: TacoService,
        private readonly homeMeasureService: HomeMeasureService,
        private readonly secretService: SecretAlimentService
    ) { }

    @Query(() => [Aliment], { name: 'aliments' })
    async getAliments(@Args('source', { type: () => String, nullable: true }) source?: AlimentSource) {
        let results: Aliment[] = [];
        if (!source || source === AlimentSource.TACO) {
            results = results.concat(await this.tacoService.findAll());
        }
        if (!source || source === AlimentSource.HOME_MEASURE) {
            results = results.concat(await this.homeMeasureService.findAll());
        }
        if (!source || source === AlimentSource.SECRET) {
            results = results.concat(await this.secretService.findAll());
        }
        if (source) {
            results = results.filter(a => a.source === source);
        }
        return results;
    }

    @Query(() => Aliment, { name: 'findAlimentById', nullable: true })
    async findAlimentById(@Args('id', { type: () => String }) id: string, @Args('source', { type: () => String, nullable: true }) source?: AlimentSource): Promise<Aliment | null> {
        let result: Aliment | null = null;

        if (!source || source === AlimentSource.TACO) {
            result = await this.tacoService.findManyByIds([id]).then(r => r[0] || null);
        }
        if (!result && (!source || source === AlimentSource.HOME_MEASURE)) {
            result = await this.homeMeasureService.findManyByIds([id]).then(r => r[0] || null);
        }
        if (!result && (!source || source === AlimentSource.SECRET)) {
            result = await this.secretService.findManyByIds([id]).then(r => r[0] || null);
        }

        return result;
    }

    @Query(() => [Aliment], { name: 'findManyAlimentById' })
    async findManyAlimentById(
        @Args('ids', { type: () => [String] }) ids: string[],
        @Args('source', { type: () => String, nullable: true }) source?: AlimentSource
    ): Promise<Aliment[]> {
        console.log('[findManyAlimentById] ids:', ids, 'source:', source);
        let results: Aliment[] = [];

        if (!source || source === AlimentSource.TACO) {
            const tacos = await this.tacoService.findManyByIds(ids);
            console.log('[findManyAlimentById] tacoService returned:', tacos.length, 'items');
            results = results.concat(tacos);
        }
        if (!source || source === AlimentSource.HOME_MEASURE) {
            const home = await this.homeMeasureService.findManyByIds(ids);
            console.log('[findManyAlimentById] homeMeasureService returned:', home.length, 'items');
            results = results.concat(home);
        }
        if (!source || source === AlimentSource.SECRET) {
            const secret = await this.secretService.findManyByIds(ids);
            console.log('[findManyAlimentById] secretService returned:', secret.length, 'items');
            results = results.concat(secret);
        }

        if (source) {
            results = results.filter(a => a.source === source);
            console.log('[findManyAlimentById] after filtering by source:', results.length, 'items');
        }

        console.log('[findManyAlimentById] final results count:', results.length);
        return results;
    }

    resolveType(value: Aliment) {
        if (value.source === AlimentSource.TACO) return TacoAliment;
        if (value.source === AlimentSource.HOME_MEASURE) return HomeMeasureAliment;
        if (value.source === AlimentSource.SECRET) return SecretAliment;
        return null;
    }
}