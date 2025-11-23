import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Address,
    AddressFindOptions,
    buildFiltering,
    errorMessagePattern,
    ListResponse,
    normalizeToList,
    PaginationQuery,
    removePropertiesForMany,
    removePropertyForOne
} from '@backend-evolved/shared';
import { Repository } from 'typeorm';

@Injectable()
export class AddressService {
    constructor(
        @InjectRepository(Address)
        private readonly addressRepository: Repository<Address>,
    ) { }

    async createAddress(addressData: Partial<Address>): Promise<Address> {
        const address = this.addressRepository.create(addressData);
        return await this.addressRepository.save(address);
    }

    async findAll(
        find?: AddressFindOptions & PaginationQuery
    ): Promise<ListResponse<Address>> {
        let page = find?.page || 1;
        let limit = find?.limit || 20;
        if (page < 1) page = 1;
        if (limit < 1) limit = 1;

        let where: any = {
            ...find?.where,
            ...buildFiltering(find?.filter)
        };

        if (find?.notDeleted) {
            where.deletedAt = null;
        }

        let [foundAddresses, total] = await this.addressRepository.findAndCount({
            where,
            select: find?.select,
            skip: (page && limit) ? (page - 1) * limit : undefined,
            take: limit || undefined,
        });

        foundAddresses = removePropertiesForMany(foundAddresses, [...(find?.removeKeys || []), 'nutritionist', 'nutritionistId']);

        return normalizeToList(foundAddresses, total, page, limit);
    }

    async findOne(find: AddressFindOptions): Promise<Address> {
        let { where } = find || {};
        const foundAddress = await this.addressRepository.findOne({
            where: {
                ...where,
                ...buildFiltering(find?.filter)
            },
            select: find?.select,
            relations: find?.relations
        });
        if (!foundAddress) {
            throw new NotFoundException(errorMessagePattern.nutritionist.address.notFound.fn());
        }

        return removePropertyForOne(foundAddress, [...(find?.removeKeys || []) , 'nutritionist', 'nutritionistId', 'deletedAt']);
    }

    async updateOne(address: Address, payload: Partial<Address>): Promise<Address> {
        this.addressRepository.merge(address, payload);
        const saved = await this.addressRepository.save(address);
        return removePropertyForOne(saved, [
            'nutritionist',
            'nutritionistId',
            'deletedAt'
        ]);
    }

    async deleteOne(address: Address): Promise<void> {
        await this.addressRepository.softRemove(address);
    }
}