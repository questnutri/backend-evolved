import { NotificationEntity, NotificationFindOptions } from '@backend-evolved/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(NotificationEntity) 
        private readonly notificationRepository: Repository<NotificationEntity>,
    ) {}

    async create(notification: Partial<NotificationEntity>): Promise<NotificationEntity> {
        const newNotification = this.notificationRepository.create(notification);
        return await this.notificationRepository.save(newNotification);
    }

    async findAll(
        options?: NotificationFindOptions
    ) {
        const {where} = options || {};
        return await this.notificationRepository.find({
            where,
            order: {
                createdAt: 'DESC',
            }
        });
    }
}