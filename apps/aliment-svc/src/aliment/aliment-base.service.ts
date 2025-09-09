import { FindOptionsWhere, MongoRepository } from "typeorm";
import { Aliment } from "@backend-evolved/shared";
import { ObjectId } from "mongodb";


export abstract class AlimentBaseService {
    constructor(
        protected repository: MongoRepository<any>
    ) { }

    async findAll() {
        return await this.repository.find();
    }

    async findOneById(id: ObjectId) {
        const result = await this.repository.findOne({where: {_id: id as unknown as any}});
        return result;
    }

    async findMany(where: FindOptionsWhere<Aliment> | FindOptionsWhere<Aliment>[]): Promise<Aliment[]> {
        return await this.repository.find({ where });
    }

    async findManyByIds(ids: ObjectId[]): Promise<Aliment[]> {
        if (!ids.length) return [];
        const found = [];
        for (const id of ids) {
            const searchResult = await this.repository.find({ where: { _id: id } });
            if (searchResult) found.push(...searchResult);
        }
        return found;
    }

    async create(createTacoDto: any) {
        const taco = this.repository.create(createTacoDto);
        return await this.repository.save(taco);
    }

}