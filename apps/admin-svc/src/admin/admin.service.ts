import { ForbiddenException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin, AUTH_SERVICE_PROXY_NAME, ProxyMessage, RegisterUserDto, UserRole } from '@backend-evolved/shared';
import { Repository } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AdminService {
    constructor(
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        @InjectRepository(Admin) private adminRepository: Repository<Admin>
    ) {}

    // async checkIfIsAllowed(adminId: string, permission: string): Promise<void> {
    //     const admin = await this.adminRepository.findOne({ where: { id: adminId } });
    //     if(admin && permission in admin) {
    //         if(admin[permission as keyof Admin] as boolean) return;
    //     }
    //     throw new ForbiddenException("You do not have permission to perform this action");
    // }

    async findOneById(id: string, getPermissions: any[] = []): Promise<Admin | null> {
        return this.adminRepository.findOne({ where: { id }, relations: getPermissions });
    }

    async createOne(data: any) {
        const payload = {
            email: data.email,
            password: data.password,
            role: UserRole.ADMIN
        };
        const userCreationResult = await firstValueFrom(
            this.authServiceProxy.send<ProxyMessage<string>, RegisterUserDto>('user.creation', payload)
        );
        if (userCreationResult && 'error' in userCreationResult) throw new RpcException(userCreationResult);

        const userId = userCreationResult.payload;
        if (!userId) throw new InternalServerErrorException('Auth service did not return user id');

        const admin = this.adminRepository.create({ ...data, id: userId, canBeDeleted: true });
        const savedAdmin = await this.adminRepository.save(admin, { reload: true });

        

    }
}
