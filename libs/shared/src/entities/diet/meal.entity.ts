import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Food } from './food.entity';
import { Diet } from './diet.entity';
import type { RepeatConfiguration } from '../../types/repeat-configuration';
import { RepeatType } from '../../types/repeat-configuration';
import { SchedulerHelper } from '../../utils';
import { scheduler } from 'timers/promises';

@Entity('meals')
export class Meal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @ManyToOne(() => Diet, (diet) => diet.meals)
    diet: Diet;

    @OneToMany(() => Food, (food) => food.meal)
    foods: Food[];

    @Column("jsonb")
    repeatConfiguration: RepeatConfiguration;

    @Column()
    hour?: string;

    @Column({
        type: 'varchar',
        nullable: true
    })
    description?: string;

    // --- TEMPORAL VERSIONING FIELDS ---
    @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    startDate: Date | null; // The date this version becomes effective

    @Column({ type: 'timestamp with time zone', nullable: true })
    endDate?: Date | null; // The date this version is superseded (exclusive end date)
    // ----------------------------------

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    isPatientRelated(patientId: string): boolean {
        return this.diet.patientId === patientId;
    }

    isNutritionistRelated(nutritionistId: string): boolean {
        return this.diet.nutritionistId === nutritionistId;
    }


    isValidForDate(targetDate: Date): boolean {
        //Checks if meal hasn't started yet
        if (targetDate < this.startDate!) return false;

        //Checks if meal has ended
        if (this.endDate && targetDate > this.endDate) return false;

        const scheduler = new SchedulerHelper(this.diet?.timeZone ?? -3);

        switch (this.repeatConfiguration.type) {
            case RepeatType.ONCE:
                //If once, meal will happen only on target date
                if (!this.repeatConfiguration.targetDate) return false;
                return scheduler.isSameDate(
                    scheduler.buildDate({date: this.repeatConfiguration.targetDate}),
                    targetDate,
                    true
                );
            case RepeatType.DAILY:
                //If daily meal will happen only if difference in days from start date
                //is multiple of repeat target
                const daysFromMealStart = scheduler.getDaysDifference(this.startDate!, targetDate);
                const interval = this.repeatConfiguration.repeatTarget || 1;
                return (daysFromMealStart % interval) === 0;

            case RepeatType.WEEKLY:
                //First it checks if the day of week matches
                const targetDayOfWeek = targetDate.getDay();
                if (!this.repeatConfiguration.daysOfWeek?.includes(targetDayOfWeek)) {
                    return false;
                }

                // Finally check the weekly interval
                const weeksFromMealStart = scheduler.getWeeksDifference(this.startDate!, targetDate);
                const weeklyInterval = this.repeatConfiguration.repeatTarget || 1;
                return (weeksFromMealStart % weeklyInterval) === 0;

            case RepeatType.MONTHLY:
                //First it checks if the day of month matches
                const targetDayOfMonth = targetDate.getDate();
                if (!this.repeatConfiguration.daysOfMonth?.includes(targetDayOfMonth)) {
                    return false;
                }

                // Finally check the monthly interval
                const monthsFromMealStart = scheduler.getMonthsDifference(this.startDate!, targetDate);
                const monthlyInterval = this.repeatConfiguration.repeatTarget || 1;
                return (monthsFromMealStart % monthlyInterval) === 0;

            default:
                return false;
        }
    }
}