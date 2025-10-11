import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('log_management_level')
export class LogManagementLevel {
    @PrimaryColumn({ type: 'uuid' })
    id: string;

    @Column({
        default: false
    })
    canViewLogs: boolean;
}