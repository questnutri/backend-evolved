import { Controller, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
    ProxyMessengerFilter, ProxyMessage, RegisterUserDto, LoginResponse,
    userId,
    User, KeysOf,
    proxyPattern,
    LoginUserDto
} from '@backend-evolved/shared';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { instanceToPlain } from 'class-transformer';
import { KeyService } from '../key/key.service';
import { UserService } from './user.service';
import { TokenService } from './token.service';

@Controller()
export class AuthProxyController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly tokenService: TokenService,
        private readonly keyService: KeyService
    ) { }

    @MessagePattern(proxyPattern.user.creation)
    @UseFilters(ProxyMessengerFilter)
    async handleUserCreation(@Payload() data: RegisterUserDto): Promise<ProxyMessage<userId>> {
        return { payload: (await this.userService.create(data)).id };
    }

    @MessagePattern(proxyPattern.user.deletionByEmail)
    @UseFilters(ProxyMessengerFilter)
    async handleUserDeletionByEmail(@Payload() payload: { email: string }): Promise<ProxyMessage<{ result: boolean }>> {
        try {
            await this.userService.deleteOneByEmail(payload.email);
            return { payload: { result: true } };
        } catch (err: any) {
            console.log('Error in user.deletion handler:', err);
            throw new RpcException({
                detail: err?.message ?? String(err),
                source: err.constructor.name
            });
        }
    }

    @MessagePattern(proxyPattern.user.getAll)
    @UseFilters(ProxyMessengerFilter)
    async handleGetAll(@Payload() data: { query: Partial<KeysOf<User>> }): Promise<ProxyMessage<User[]>> {
        const users = await this.userService.findAll(data.query);
        return { payload: users };
    }

    @MessagePattern(proxyPattern.user.getManyByIds)
    @UseFilters(ProxyMessengerFilter)
    async handleGetManyByIds(@Payload() data: { ids: string[] }): Promise<ProxyMessage<User[]>> {
        const users = (await this.userService.findManyByIds(data.ids))
            .map(user => instanceToPlain(user) as User); //removes passwordHash
        return { payload: users };
    }

    @MessagePattern(proxyPattern.user.getOneById)
    @UseFilters(ProxyMessengerFilter)
    async getOneById(@Payload() data: { id: string }): Promise<ProxyMessage<Partial<User>>> {
        return { payload: instanceToPlain(await this.userService.findOne({ id: data.id })) };
    }


    @MessagePattern(proxyPattern.nutritionist.approval)
    @UseFilters(ProxyMessengerFilter)
    async handleNutritionistApproval(@Payload() email: string): Promise<ProxyMessage<Partial<User>>> {
        const user = await this.authService.approveNutritionist(email);
        return { payload: instanceToPlain(user) };
    }

    @MessagePattern(proxyPattern.admin.login)
    @UseFilters(ProxyMessengerFilter)
    async handleAdminLogin(@Payload() payload: LoginUserDto): Promise<ProxyMessage<LoginResponse>> {
        try {
            const result = await this.authService.adminLogin(payload);
            return { payload: result };
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    @MessagePattern(proxyPattern.user.deletionById)
    @UseFilters(ProxyMessengerFilter)
    async handleUserDeletion(@Payload() data: { id: string }): Promise<ProxyMessage<{ result: boolean }>> {
        await this.userService.deleteOneById(data.id);
        return { payload: { result: true } };
    }

}
