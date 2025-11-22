import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { PatientNutritionist } from './patient-nutritionist.entity';
import { WaterGoal } from './water-goal.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Nutritionist } from '../nutritionist/nutritionist.entity';
import { Filterable } from '../../utils';
import { LevelOfActivity, Gender } from '../../enums';

//TODO: IMPLEMENT SOFT DELETE
@Entity('patients')
export class Patient {
    @PrimaryColumn('uuid')
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7g8h-9i10-jk11lm12no13' })
    id: string;

    @Column()
    @ApiProperty({ example: 'Jane Doe' })
    @Filterable()
    name: string;

    @Column()
    @ApiProperty({ example: 'jane.doe@patient.com' })
    email: string;

    @Column({
        unique: true,
    })
    @ApiProperty({ example: '123.456.789-00' })
    documentNumber: string;

    @Column({ type: 'date', nullable: true })
    @ApiProperty({ example: '1990-01-01', required: false })
    dateOfBirth?: Date;

    @Column({ type: 'float', nullable: true })
    @ApiProperty({ example: 170, required: false })
    heightInCm?: number;

    @Column({
        type: 'enum',
        enum: Gender,
        nullable: true,
        default: null,
    })
    @ApiProperty({ example: Gender.FEMALE })
    gender?: Gender;

    @Column({
        type: 'enum',
        enum: LevelOfActivity,
        nullable: true,
        default: null,
    })
    @ApiProperty({ example: LevelOfActivity.MODERATELY_ACTIVE })
    levelOfActivity?: LevelOfActivity;

    @OneToMany(() => WaterGoal, wg => wg.patient)
    @ApiProperty({ type: () => [WaterGoal] })
    waterGoals: WaterGoal[];

    @OneToMany(() => PatientNutritionist, pn => pn.patient)
    @ApiProperty({ type: () => [Nutritionist] })
    nutritionists: PatientNutritionist[];

    hasNutritionist(nutritionistId: string): boolean {
        if (this.nutritionists) {
            return this.nutritionists?.some(n => n.nutritionistId === nutritionistId) ?? false;
        }
        return false;
    }
    //TODO: Add => gender, date of birth, height, Medical Information, Allergies, Medical Conditions, Notes, Medications, Preferences, goal, Weight, level of activity
}