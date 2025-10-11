import { PrimaryColumn, Column, Entity } from "typeorm";

@Entity('nutritionist_management_level')
export class NutritionistManagementLevel {
    @PrimaryColumn({type: 'uuid'})
    id: string;

    @Column({
        default: false
    })
    canViewNutritionists: boolean;

    @Column({
        default: false
    })
    canViewNutritionistProfile: boolean;

    @Column({
        default: false
    })
    canCreateNutritionist: boolean;

    @Column({
        default: false
    })
    canUpdateNutritionist: boolean;

    @Column({
        default: false
    })
    canDeleteNutritionist: boolean;


    @Column({
        default: false
    })
    canViewNutritionistPatients: boolean;

}