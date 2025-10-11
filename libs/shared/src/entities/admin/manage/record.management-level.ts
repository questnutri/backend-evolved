import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('record_management_level')
export class RecordManagementLevel {
    @PrimaryColumn({type: 'uuid'})
    id: string;

    @Column({
        default: false
    })
    canViewRecords: boolean;

    @Column({
        default: false
    })
    canViewRecordDetails: boolean;
}