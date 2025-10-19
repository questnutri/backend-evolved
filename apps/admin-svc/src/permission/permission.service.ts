import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class PermissionService {
    constructor(
        @InjectEntityManager()
        private entityManager: EntityManager,
    ) { }

    async checkIfHasPermission(options: {
        managementClass: any,
        userId: string,
        permissionField: string
    }
    ): Promise<boolean> {
        try {
            // Find the management level for this user using the entity class
            const managementLevel = await this.entityManager.findOne<any>(
                options.managementClass,
                {
                    where: { id: options.userId }
                }
            );

            if (!managementLevel) {
                return false;
            }

            return managementLevel[options.permissionField] === true;
        } catch (error) {
            console.error('Permission check error:', error);
            return false;
        }
    }
}