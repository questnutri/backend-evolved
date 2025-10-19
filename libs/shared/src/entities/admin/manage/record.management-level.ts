import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Admin } from "../admin.entity";


@Entity('record_management_level')
export class RecordManagementLevel {
    @PrimaryColumn({type: 'uuid'})
    id: string;

    @OneToOne(() => Admin, admin => admin.adminManagementLevel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id' })
    admin: Admin;

    @Column({
        default: false
    })
    canViewRecords: boolean;

    @Column({
        default: false
    })
    canViewRecordDetails: boolean;
}