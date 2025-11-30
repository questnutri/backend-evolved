import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum NotificationSeverity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error'
}

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
        type: 'varchar',
        nullable: true
    })
    title: string;

    @Column({
        type: 'text',
        nullable: false
    })
    message: string;

    @Column({
        type: 'enum',
        enum: NotificationSeverity,
        default: NotificationSeverity.INFO
    })
    severity: NotificationSeverity;

    @Column({
        type: 'boolean',
        default: false
    })
    read: boolean;

    @CreateDateColumn()
    createdAt: Date;
}