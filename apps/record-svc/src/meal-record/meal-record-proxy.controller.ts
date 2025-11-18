import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MealRecordService } from './meal-record.service';
import { MealRecord, KeysOf } from '@backend-evolved/shared';

@Controller()
export class MealRecordMessageController {
    constructor(private readonly mealRecordService: MealRecordService) { }

    @MessagePattern('meal-record.findByPatientAndDateRange')
    async findByPatientAndDateRange(
        @Payload() data: { 
            patientId: string; 
            startDate: Date; 
            endDate: Date; 
        }
    ): Promise<MealRecord[]> {
        const query: Partial<KeysOf<MealRecord>> = {
            patientId: data.patientId
        };

        // Get all meal records for the patient first
        const allRecords = await this.mealRecordService.findAll(query);
        
        // Filter by date range (the service should handle this, but for now we'll do it here)
        return allRecords.filter(record => {
            const recordDate = new Date(record.mealRelativeDate);
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            
            // Normalize dates to ignore time
            recordDate.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            
            return recordDate >= startDate && recordDate <= endDate;
        });
    }

    @MessagePattern('meal-record.findByMealAndDate')
    async findByMealAndDate(
        @Payload() data: { 
            mealId: string; 
            patientId: string; 
            mealRelativeDate: Date; 
        }
    ): Promise<MealRecord | null> {
        const query: Partial<KeysOf<MealRecord>> = {
            mealId: data.mealId,
            patientId: data.patientId
        };

        const allRecords = await this.mealRecordService.findAll(query);
        
        // Find the record that matches the specific date
        const targetDate = new Date(data.mealRelativeDate);
        targetDate.setHours(0, 0, 0, 0);
        
        return allRecords.find(record => {
            const recordDate = new Date(record.mealRelativeDate);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate.getTime() === targetDate.getTime();
        }) || null;
    }

    @MessagePattern()
    async handleFindRecordsForMeal() {
        
    }
}
