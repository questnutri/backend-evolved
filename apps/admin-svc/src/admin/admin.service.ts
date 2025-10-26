import {
    ForbiddenException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Admin, AdminManagementLevel, AUTH_SERVICE_PROXY_NAME, ContextUser, ProxyMessage, proxyPattern, RegisterUserDto, ROOT_ADMIN_ID, sendProxyMessage, UserRole } from '@backend-evolved/shared';
import { EntityManager, Repository } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PermissionService } from '../permission/permission.service';

@Injectable()
export class AdminService {
    constructor(
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        @InjectRepository(Admin) private adminRepository: Repository<Admin>,
        @InjectEntityManager() private readonly entityManager: EntityManager,
        private readonly permissionService: PermissionService
    ) {}

    private managementLevels: Array<keyof Admin> = [
        'adminManagementLevel',
        'nutritionistManagementLevel',
        'patientManagementLevel',
        'dietManagementLevel',
        'recordManagementLevel',
        'gameManagementLevel',
        'logManagementLevel'
    ] as const;

    async findAll(applicantId: string): Promise<Admin[]> {
        const admins = await this.adminRepository.find();
        const processedAdmins = [];
        for (const admin of admins) {
            const adaptedAdmin = await this.adaptManagementViewPermission(applicantId, admin);
            processedAdmins.push(this.cleanData(adaptedAdmin));
        }
        return processedAdmins;
    }

    async findOneById(id: string, applicantId: string, options: {
        adaptManagementView?: boolean
    }={adaptManagementView: true}): Promise<Partial<Admin>> {
        const admin = await this.adminRepository.findOne({
            where: { id },
        });
        if (admin) {
            const adaptedAdmin = options.adaptManagementView
                ? await this.adaptManagementViewPermission(applicantId, admin)
                : admin;
            return this.cleanData(adaptedAdmin);
        }
        throw new NotFoundException(`Admin with id ${id} not found`);
    }

    // async updateOne(id: string, updateData: Partial<RegisterUserDto>): Promise<Partial<Admin>> {
    //     const adminToUpdate = await this.adminRepository.findOne({ where: { id } });
    //     if (!adminToUpdate) {
    //         throw new NotFoundException(`Admin with id ${id} not found`);
    //     }

    //     Object.assign(adminToUpdate, updateData);
    //     await this.adminRepository.save(adminToUpdate);
    //     return this.cleanData(adminToUpdate);
    // }

    private async adaptManagementViewPermission(applicantId: string, admin: Admin): Promise<Partial<Admin>> {
        const hasPermission = await this.permissionService.checkIfHasPermission({
            managementClass: AdminManagementLevel,
            userId: applicantId,
            permissionField: "canViewManagementLevels"
        });

        // Create a copy of the admin object
        const adaptedAdmin = { ...admin } as any;

        // If user doesn't have permission, remove all management level objects except adminManagementLevel
        if (!hasPermission) {
            for (const level of this.managementLevels) {
                delete adaptedAdmin[level];
            }
        }

        return adaptedAdmin;
    }

    // async findOneById(id: string, getPermissions: any[] = []): Promise<Admin | null> {
    //     return await this.adminRepository.findOne({
    //         where: { id },
    //         relations: getPermissions.length > 0 ? getPermissions : [
    //             'adminManagementLevel',
    //             'nutritionistManagementLevel',
    //             'patientManagementLevel',
    //             'dietManagementLevel',
    //             'recordManagementLevel',
    //             'gameManagementLevel',
    //             'logManagementLevel'
    //         ]
    //     });
    // }

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

        return savedAdmin;
    }

    async deleteOne(admin: Admin): Promise<void> {
        await this.adminRepository.remove(admin);
    }

    async deleteOneById(id: string): Promise<void> {
        const foundAdmin = await this.adminRepository.findOne({ where: { id } });
        if (!foundAdmin) throw new NotFoundException(`Admin with id ${id} not found`);
        if (!foundAdmin.canBeDeleted) throw new ForbiddenException(`Admin with id ${id} cannot be deleted`);
        const userDeletion = await sendProxyMessage<{ result: boolean }>(
            {
                proxy: this.authServiceProxy,
                pattern: proxyPattern.user.deletionById,
                data: { id: foundAdmin.id },
                options: {
                    retry: { count: 5, delay: 50 }
                }
            }
        );
        if (!userDeletion.result) {
            throw new Error(`Failed to delete user with id ${id} from auth service`);
        }
        await this.adminRepository.remove(foundAdmin);
    }

    // Helper function to remove IDs from management levels
    private cleanData(admin: Partial<Admin>): Admin {
        const cleanedAdmin = { ...admin } as any;

        this.managementLevels.forEach(level => {
            const levelValue = cleanedAdmin[level] as any;
            if (levelValue) {
                const { id, ...levelWithoutId } = levelValue;
                cleanedAdmin[level] = levelWithoutId;
            }
        });
        delete cleanedAdmin.canBeDeleted;
        return cleanedAdmin as Admin;
    }

    /**
     * This function cannot be activated by an admin that does not have the permission to grant the specified permission.
     * So it's assumed that the applicant has the permission to grant it.
     */
    async grantPermission(
        data: {
            targetAdmin: string,
            managementClass: string,
            permissions: { [key: string]: boolean },
            applicantId: string
        }
    ): Promise<any> {
        if(data.targetAdmin === ROOT_ADMIN_ID) {
            throw new ForbiddenException('You cannot modify permissions for this user.');
        }
        const targetAdminFound = await this.adminRepository.findOne({ where: { id: data.targetAdmin } });
        if (!targetAdminFound) {
            throw new NotFoundException(`Admin with id ${data.targetAdmin} not found`);
        }

        const permissionsToGrant: Record<string, boolean> = {};
        const rejectedPermissions: string[] = [];

        for (const [permission, value] of Object.entries(data.permissions)) {
            const hasPermission = await this.permissionService.checkIfHasPermission({
                managementClass: data.managementClass,
                userId: data.applicantId,
                permissionField: permission
            });

            if (hasPermission) {
                permissionsToGrant[permission] = value;
            } else {
                rejectedPermissions.push(permission);
            }
        }

        if (Object.keys(permissionsToGrant).length === 0) {
            throw new ForbiddenException(
                'Failed to grant permissions. You can only grant permissions that your account has.');
        }

        let managementLevel = await this.entityManager.findOne(
            data.managementClass,
            { where: { id: targetAdminFound.id } }
        );

        const dataToSave = {
            id: targetAdminFound.id,
            ...permissionsToGrant
        };

        if (!managementLevel) {
            managementLevel = this.entityManager.create(data.managementClass, dataToSave);
        } else {
            managementLevel = this.entityManager.merge(data.managementClass, managementLevel, dataToSave);
        }

        const result = await this.entityManager.save(managementLevel);
        return {
            ...result,
            _meta: {
                grantedPermissions: Object.keys(permissionsToGrant),
                rejectedPermissions: rejectedPermissions
            }
        };

    }
}
