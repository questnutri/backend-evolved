import type { i18n } from "../../interfaces";
import { NotificationType } from "../../enums";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export interface NotificationMessage {
    title?: string;
    message: string;
}

export interface NotificationMessageI18N {
    [language: string]: NotificationMessage;
}

//TODO: Implement a more robust notification entity, to customize looking field of it.

@Entity('notifications')
export class NotificationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        nullable: false
    })
    userId: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
        default: NotificationType.INFO
    })
    type: NotificationType;

    @Column({
        type: 'jsonb',
        nullable: false
    })
    i18n: i18n<NotificationMessage>;

    @Column({
        type: 'jsonb',
        nullable: true
    })
    additionalData?: any;

    @Column({
        type: 'boolean',
        default: false
    })
    autoAcknowledged: boolean = false;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    acknowledgeAt: Date | null;
}