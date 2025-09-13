import { Resolver, Query, Args } from '@nestjs/graphql';
import { Aliment, AlimentResponse, SecretAliment } from '@backend-evolved/shared';
import { TacoAliment } from '@backend-evolved/shared';
import { HomeMeasureAliment } from '@backend-evolved/shared';
import { TacoService } from '../taco/taco.service';
import { HomeMeasureService } from '../home-measure/home-measure.service';
import { AlimentSource } from '@backend-evolved/shared';
import { SecretAlimentService } from '../secret-aliment/secret-aliment.service';
import { ObjectId } from 'mongodb';
import { GraphQLJSON } from 'graphql-type-json';


@Resolver(() => Aliment)
export class AlimentResolver {
    constructor(
        private readonly tacoService: TacoService,
        private readonly homeMeasureService: HomeMeasureService,
        private readonly secretService: SecretAlimentService
    ) { }

    @Query(() => AlimentResponse, { name: 'aliments' })
    async getAliments(
        @Args('source', { type: () => String, nullable: true }) source?: AlimentSource,
        @Args('page', { type: () => Number, nullable: true }) page?: number,
        @Args('items', { type: () => Number, nullable: true }) items?: number,
        @Args('query', { type: () => GraphQLJSON, nullable: true }) query?: { name?: string }
    ) {
        let results: Aliment[] = [];
        if (!source || source === AlimentSource.TACO) {
            results = results.concat(await this.tacoService.findAll({ name: query?.name }));
        }
        if (!source || source === AlimentSource.HOME_MEASURE) {
            results = results.concat(await this.homeMeasureService.findAll({ name: query?.name }));
        }
        if (!source || source === AlimentSource.SECRET) {
            results = results.concat(await this.secretService.findAll({ name: query?.name }));
        }
        if (source) {
            results = results.filter(a => a.source === source);
        }
        // if (where?.name) {
        //     const nameLower = where.name.toLowerCase();
        //     results = results.filter(a => a.name?.toLowerCase().includes(nameLower));
        // }

        const totalItems = results.length;
        const currentPage = page && page > 0 ? page : 1;
        const itemsPerPage = items || 100;
        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const data = results.slice(startIdx, endIdx);
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const isFirstPage = currentPage === 1;
        const isLastPage = currentPage >= totalPages;

        return {
            currentPage,
            length: data.length,
            isFirstPage,
            isLastPage,
            totalPages,
            totalItems,
            data,
        };
    }

    @Query(() => Aliment, { name: 'findAlimentById', nullable: true })
    async findAlimentById(@Args('id', { type: () => String }) id: string, @Args('source', { type: () => String, nullable: true }) source?: AlimentSource): Promise<Aliment | null> {
        let result: Aliment | null = null;

        const objectId = new ObjectId(id);

        if (!source || source === AlimentSource.TACO) {
            result = await this.tacoService.findOneById(objectId) || null;
        }
        if (!result && (!source || source === AlimentSource.HOME_MEASURE)) {
            result = await this.homeMeasureService.findOneById(objectId) || null;
        }
        if (!result && (!source || source === AlimentSource.SECRET)) {
            result = await this.secretService.findOneById(objectId) || null;
        }

        return result;
    }

    @Query(() => [Aliment], { name: 'findManyAlimentById' })
    async findManyAlimentById(
        @Args('ids', { type: () => [String] }) ids: string[],
        @Args('source', { type: () => String, nullable: true }) source?: AlimentSource
    ): Promise<Aliment[]> {
        let results: Aliment[] = [];
        const objectIds = ids.map(id => new ObjectId(id));

        if (!source || source === AlimentSource.TACO) {
            const tacos = await this.tacoService.findManyByIds(objectIds);
            results = results.concat(tacos);
        }
        if (!source || source === AlimentSource.HOME_MEASURE) {
            const home = await this.homeMeasureService.findManyByIds(objectIds);
            results = results.concat(home);
        }
        if (!source || source === AlimentSource.SECRET) {
            const secret = await this.secretService.findManyByIds(objectIds);
            results = results.concat(secret);
        }

        if (source) {
            results = results.filter(a => a.source === source);
        }

        return results;
    }

    resolveType(value: Aliment) {
        if (value.source === AlimentSource.TACO) return TacoAliment;
        if (value.source === AlimentSource.HOME_MEASURE) return HomeMeasureAliment;
        if (value.source === AlimentSource.SECRET) return SecretAliment;
        return null;
    }
}