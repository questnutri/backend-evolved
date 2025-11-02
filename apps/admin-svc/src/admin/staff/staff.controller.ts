import {
    Controller,
    Body,
    Post,
    Inject,
    UseGuards,
    UseFilters,
    Get,
    Param,
    Delete
} from '@nestjs/common';
import {
    AdminManagementLevel,
    AUTH_SERVICE_PROXY_NAME,
    AvailableGrantEntities,
    ControllerExceptionFilter,
    JwtRoleGuard,
    RegisterUserDto,
    ContextUser,
    sendProxyMessage,
    User
} from '@backend-evolved/shared';
import { ClientProxy } from '@nestjs/microservices';
import { AdminService } from '../admin.service';
import { ManagementGuard } from '../../guards/management.guard';
import { PermissionService } from '../../permission/permission.service';

@Controller('staff')
export class StaffController {
    constructor(
        private readonly adminService: AdminService,
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        private readonly permissionService: PermissionService
    ) { }

    @Post('create')
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(AdminManagementLevel, "canCreateAdmin")
    )
    @UseFilters(ControllerExceptionFilter)
    async createAdmin(
        @Body() adminData: Partial<RegisterUserDto>
    ) {
        return await this.adminService.createOne(adminData);
    }


    @Get('all')
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(AdminManagementLevel, "canViewAdmins")
    )
    @UseFilters(ControllerExceptionFilter)
    async getAll(
        @ContextUser() applicantUser: ContextUser
    ): Promise<any[]> {
        const admins = await this.adminService.findAll(applicantUser.id);
        const userAdmins = await sendProxyMessage<User[]>(
            {
                proxy: this.authServiceProxy,
                pattern: 'user.getManyByIds',
                data: { ids: admins.map(a => a.id) },
                options: {
                    retry: { count: 5, delay: 50 }
                }
            }
        );

        return admins.map(admin => {
            const userData = userAdmins.find((u: User) => u.id === admin.id);
            return {
                ...admin,
                ...userData
            } as any;
        });
    }

    @Get(':id')
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(AdminManagementLevel, "canViewAdminProfile")
    )
    @UseFilters(ControllerExceptionFilter)
    async getById(
        @Param('id') id: string,
        @ContextUser() applicantUser: ContextUser
    ): Promise<any> {
        const canViewManagementLevels = await this.permissionService.checkIfHasPermission({
            userId: applicantUser.id,
            managementClass: AdminManagementLevel,
            permissionField: "canViewManagementLevels"
        });

        console.log('canViewManagementLevels', canViewManagementLevels);

        const foundAdmin = await this.adminService.findOneById(
            id,
            applicantUser.id,
            {
                adaptManagementView: !canViewManagementLevels
            }
        );
        if (!foundAdmin) throw new Error(`Admin with id ${id} not found`);

        const userAdmin = await sendProxyMessage<User>(
            {
                proxy: this.authServiceProxy,
                pattern: 'user.getOneById',
                data: { id: foundAdmin.id },
                options: {
                    retry: { count: 5, delay: 50 }
                }
            }
        );

        return {
            ...foundAdmin,
            ...userAdmin
        };
    }

    @Post(':id/grant-permission/:permission')
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(AdminManagementLevel, "canGrantAdminPermissions")
    )
    @UseFilters(ControllerExceptionFilter)
    async grantPermission(
        @Param('id') id: string,
        @Param('permission') permissionType: string,
        @ContextUser() applicantUser: ContextUser,
        @Body() permissions: any
    ): Promise<any> {
        const managementClass = AvailableGrantEntities[permissionType];
        if (!managementClass) {
            throw new Error(`Permission ${permissionType} is not valid.`);
        }

        return await this.adminService.grantPermission({
            targetAdmin: id,
            managementClass,
            applicantId: applicantUser.id,
            permissions
        });
    }

    @Delete(':id')
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(AdminManagementLevel, "canDeleteAdmin")
    )
    @UseFilters(ControllerExceptionFilter)
    async delete(
        @Param('id') id: string,
    ) {
        await this.adminService.deleteOneById(id);
    }

}