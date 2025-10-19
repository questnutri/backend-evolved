import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    Type
} from '@nestjs/common';
import { PermissionService } from '../permission/permission.service';

export function ManagementGuard(managementClass: any, permissionField: string): Type<CanActivate> {
    @Injectable()
    class PermissionGuardMixin implements CanActivate {
        constructor(
            private permissionService: PermissionService
        ) {}

        async canActivate(context: ExecutionContext): Promise<boolean> {
            // Get the request object
            const request = context.switchToHttp().getRequest();
            const userId = request.headers['user-id'];
            console.log(userId);

            if (!userId) {
                throw new InternalServerErrorException('User not found in request.');
            }

            const hasPermission = await this.permissionService.checkIfHasPermission(
                {
                    managementClass,
                    userId,
                    permissionField
                }
            );

            if (!hasPermission) {
                throw new ForbiddenException('User not allowed to perform this action.');
            }

            return true;
        }
    }

    return PermissionGuardMixin;
}