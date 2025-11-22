import { Controller, UseFilters } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import {
    ProxyMessengerFilter,
    ProxyMessage,
    LoginResponse,
    User,
    proxyPattern,
    LoginUserDto
} from '@backend-evolved/shared';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { instanceToPlain } from 'class-transformer';
import { UserService } from '../services/user.service';

@Controller()
export class AuthProxyController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
    ) { }

    @MessagePattern(proxyPattern.user.creation.key)
    @UseFilters(ProxyMessengerFilter)
    async handleUserCreation(
        @Payload() data: typeof proxyPattern.user.creation.payload
    ): Promise<ProxyMessage<
        typeof proxyPattern.user.creation.response
    >> {
        const createdUser = await this.userService.create(data);
        return { payload: createdUser };
    }

    @MessagePattern(proxyPattern.user.deletionByEmail.key)
    @UseFilters(ProxyMessengerFilter)
    async handleUserDeletionByEmail(
        @Payload() payload: typeof proxyPattern.user.deletionByEmail.payload
    ): Promise<ProxyMessage<
        typeof proxyPattern.user.deletionByEmail.response
    >> {
        await this.userService.deleteOneByEmail(payload.email);
        return { payload: { result: true } };
    }

    @MessagePattern(proxyPattern.user.getAll.key)
    @UseFilters(ProxyMessengerFilter)
    async handleGetAll(
        @Payload() payload: typeof proxyPattern.user.getAll.payload
    ): Promise<ProxyMessage<typeof proxyPattern.user.getAll.response>> {
        const { removeKeys } = payload;
        const users = await this.userService.findAll({
            ...payload,
            removeKeys: [...(removeKeys || []), 'passwordHash'] //Always remove passwordHash
        });
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

    @MessagePattern(proxyPattern.user.deletionById.key)
    @UseFilters(ProxyMessengerFilter)
    async handleUserDeletion(
        @Payload() data: typeof proxyPattern.user.deletionById.payload
    ): Promise<ProxyMessage<
        typeof proxyPattern.user.deletionById.response
    >> {
        await this.userService.deleteOneById(data.id);
        return { payload: { result: true } };
    }

}
