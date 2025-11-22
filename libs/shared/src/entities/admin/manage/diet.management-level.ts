import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Admin } from "../admin.entity";


@Entity('diet_management_level')
export class DietManagementLevel {
    @PrimaryColumn({ type: 'uuid' })
    id: string;

    @OneToOne(() => Admin, admin => admin.adminManagementLevel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id' })
    admin: Admin;

    @Column({
        default: false
    })
    canViewDiets: boolean;

    @Column({
        default: false
    })
    canViewDietDetails: boolean;

    @Column({
        default: false
    })
    canActivateDiet: boolean;

    @Column({
        default: false
    })
    canCreateDiet: boolean;

    @Column({
        default: false
    })
    canUpdateDiet: boolean;

    @Column({
        default: false
    })
    canDeleteDiet: boolean;

    @Column({
        default: false
    })
    canViewMeals: boolean;

    @Column({
        default: false
    })
    canCreateMeal: boolean;

    @Column({
        default: false
    })
    canUpdateMeal: boolean;

    @Column({
        default: false
    })
    canDeleteMeal: boolean;

    @Column({
        default: false
    })
    canViewFoods: boolean;

    @Column({
        default: false
    })
    canCreateFood: boolean;

    @Column({
        default: false
    })
    canUpdateFood: boolean;

    @Column({
        default: false
    })
    canDeleteFood: boolean;

    @Column({
        default: false
    })
    canViewDietPlan: boolean;
}