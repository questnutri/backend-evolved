import { FindOptionsWhere, In, Repository, ObjectId } from "typeorm";
import { Aliment } from "@backend-evolved/shared";


export abstract class AlimentBaseService {
    constructor(
        protected repository: Repository<any>
    ) { }

    async findAll() {
        return this.repository.find();
    }

    async findMany(where: FindOptionsWhere<Aliment> | FindOptionsWhere<Aliment>[]): Promise<Aliment[]> {
        return this.repository.find({ where });
    }

    async findManyByIds(ids: string[]): Promise<Aliment[]> {
        console.log(ids);
        if (!ids.length) return [];
        return this.repository.find({
            where: { _id: In(ids) as any }
        });
    }

    async create(createTacoDto: any) {
        const taco = this.repository.create(createTacoDto);
        return this.repository.save(taco);
    }

}