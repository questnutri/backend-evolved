import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('diet_management_level')
export class DietManagementLevel {
    @PrimaryColumn({ type: 'uuid' })
    id: string;

    @Column({
        default: false
    })
    canViewDiets: boolean;

    @Column({
        default: false
    })
    canViewDietDetails: boolean;

}