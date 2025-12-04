import { CreateNotificationDto, NotificationEntity, NotificationFindOptions } from '@backend-evolved/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(NotificationEntity)
        private readonly notificationRepository: Repository<NotificationEntity>,
    ) { }

    async create(notification: CreateNotificationDto): Promise<NotificationEntity> {
        const newNotification = this.notificationRepository.create(notification);
        return await this.notificationRepository.save(newNotification);
    }

    async findAll(
        options?: NotificationFindOptions
    ) {
        const { where } = options || {};
        return await this.notificationRepository.find({
            where,
            order: {
                createdAt: 'DESC',
            },
            withDeleted: options?.withDeleted || false,
        });
    }

    async findManyByIds(ids: string[]): Promise<NotificationEntity[]> {
        if (!ids || ids.length === 0) return [];
        return await this.notificationRepository.find({
            where: {
                id: In(ids)
            },
            order: {
                createdAt: 'DESC',
            }
        });
    }

    async remove(notifications: NotificationEntity[]): Promise<NotificationEntity[]> {
        if (!notifications || notifications.length === 0) return [];
        return await this.notificationRepository.remove(notifications);
    }

    async deleteManyByIds(ids: string[]): Promise<NotificationEntity[]> {
        if (!ids || ids.length === 0) return [];
        const notifications = await this.findManyByIds(ids);
        return await this.remove(notifications);
    }
}