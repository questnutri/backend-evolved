import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
    errorMessagePattern,
    FindUserOptions,
    KeysOf,
    PaginationQuery,
    RefreshToken,
    RegisterUserDto,
    removePropertiesForMany,
    removePropertyForOne,
    ROOT_ADMIN_EMAIL,
    ROOT_ADMIN_ID,
    User,
} from "@backend-evolved/shared";
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(RefreshToken) private refreshRepository: Repository<RefreshToken>,
    ) { }

    async create(userData: RegisterUserDto): Promise<any> {
        const existing = await this.userRepository.findOne({ where: { email: userData.email } });
        if (existing) throw new ConflictException(
            errorMessagePattern
                .auth
                .emailAlreadyExists
                .fn()
        );
        const hash = await bcrypt.hash(userData.password, 10);
        const user = this.userRepository.create({
            email: userData.email,
            passwordHash: hash,
            role: userData.role
        });
        const savedUser = await this.userRepository.save(user, {reload: true});
        return removePropertyForOne(savedUser, ['passwordHash']);
    }

    async findAll(find?: FindUserOptions & PaginationQuery): Promise<User[]> {
        let page = find?.page || 1;
        let limit = find?.limit || 20;
        if (page < 1) page = 1;
        if (limit < 1) limit = 1;

        let users = await this.userRepository.find({
            where: find?.where,
            select: find?.select,
            skip: (page && limit) ? (page - 1) * limit : undefined,
            take: limit || undefined,
        });

        users = removePropertiesForMany(users, find?.removeKeys);

        return users;
    }

    async findManyByIds(ids: string[]): Promise<User[]> {
        if (!ids.length) return [];
        return await this.userRepository.find({
            where: { id: In(ids) }
        });
    }

    async findOne(where: { [key in keyof User]?: any }) {
        const foundUser = await this.userRepository.findOneBy(where);
        if (!foundUser) throw new NotFoundException(
            errorMessagePattern
                .auth
                .userNotFoundWithEmail
                .fn()
        );
        return foundUser;
    }

    async updateOneById(id: string, updateData: Partial<User>): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException(
            errorMessagePattern
                .auth
                .userNotFoundWithId
                .fn(id)
        );
        const updatedUser = this.userRepository.merge(user, updateData);
        return await this.userRepository.save(updatedUser);
    }

    async deleteOneById(id: string): Promise<void> {
        if (id === ROOT_ADMIN_ID) {
            throw new ForbiddenException('You cannot delete this user.');
        }
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException(
            errorMessagePattern
                .auth
                .userNotFoundWithId
                .fn(id)
        );

        // Find all refresh tokens associated with this user and delete them
        const refreshTokens = await this.refreshRepository.find({
            where: { user: { id } },
            relations: ['user']
        });

        if (refreshTokens.length > 0) {
            await this.refreshRepository.remove(refreshTokens);
        }

        // Now delete the user
        await this.userRepository.remove(user);
    }


    async deleteOneByEmail(email: string): Promise<void> {
        console.log("[Auth-Service] user.service.ts => Received email for deletion: ", email);
        if (!email) return;
        if (email === ROOT_ADMIN_EMAIL) {
            throw new ForbiddenException('You cannot delete this user.');
        }
        const foundUser = await this.userRepository.findOne({ where: { email } });
        if (!foundUser) throw new NotFoundException(`User with email ${email} not found`);

        console.log("[Auth-Service] user.service.ts => Found user for deletion: ", foundUser);
        if (foundUser.email === ROOT_ADMIN_EMAIL) return;
        if (foundUser.email !== email) return;

        const refreshTokens = await this.refreshRepository.find({
            where: { user: { id: foundUser.id } },
            relations: ['user']
        });

        if (refreshTokens.length > 0) {
            await this.refreshRepository.remove(refreshTokens);
        }

        await this.userRepository.remove(foundUser);
    }

    async save(user: User, reload: boolean = true): Promise<User> {
        return await this.userRepository.save(user, { reload });
    }

}
