import { ApiProperty } from '@nestjs/swagger';
import { Diet, Meal } from '@backend-evolved/shared';

export class CleanedMealRecord {
    @ApiProperty({ description: 'The meal record ID' })
    id: string;

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update timestamp' })
    updatedAt: Date;

    @ApiProperty({ description: 'Whether the meal was completed' })
    isCompleted: boolean;

    @ApiProperty({ description: 'The relative date of the meal' })
    mealRelativeDate: Date;
}

export class MealPlan {
    @ApiProperty({ description: 'The meal details' })
    meal: Meal;

    @ApiProperty({ description: 'The meal record if exists (without redundant fields)', required: false })
    mealRecord: CleanedMealRecord | null;
}

export class DietDayPlan {
    @ApiProperty({ description: 'The relative date for this day plan' })
    relativeDate: Date;

    @ApiProperty({ description: 'List of meal plans for this day', type: [MealPlan] })
    mealPlans: MealPlan[];
}

export class DietPlan {
    @ApiProperty({ description: 'The diet ID' })
    diet: Diet;

    @ApiProperty({ description: 'List of daily plans', type: [DietDayPlan] })
    plan: DietDayPlan[];

    @ApiProperty({ description: 'The start date of the diet'})
    startDate?: Date;

    @ApiProperty({ description: 'The end date of the diet'})
    endDate?: Date | null;
}
