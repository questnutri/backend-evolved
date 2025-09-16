import { FindOptionsWhere, MongoRepository } from "typeorm";
import { Aliment } from "@backend-evolved/shared";
import { ObjectId } from "mongodb";


export abstract class AlimentBaseService {
    constructor(
        protected repository: MongoRepository<any>
    ) { }


    async findAll(where?: { name?: string }) {
        if (where?.name) {
            return await this.repository.find({
                where: {
                    name: new RegExp(where.name, 'i')
                }
            });
        }
        return await this.repository.find();
    }

    async findOneById(id: ObjectId) {
        const result = await this.repository.findOne({ where: { _id: id as unknown as any } });
        return result;
    }

    async findMany(where: FindOptionsWhere<Aliment> | FindOptionsWhere<Aliment>[]): Promise<Aliment[]> {
        return await this.repository.find({ where });
    }

    async findManyByIds(ids: ObjectId[]): Promise<Aliment[]> {
        if (!ids.length) return [];
        return await this.repository.find({
            where: { _id: { $in: ids as any } }
        });
    }

}