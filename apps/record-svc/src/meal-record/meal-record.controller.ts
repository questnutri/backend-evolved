import { Controller, Get, Post, Body, Param, Headers, UseGuards, UseFilters, NotFoundException, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { MealRecordService } from './meal-record.service';
import { MealRecord, JwtRoleGuard, ControllerExceptionFilter, CreatePatientMealRecordDto } from '@backend-evolved/shared';

@Controller('/meal')
@ApiBearerAuth('bearer')
@ApiSecurity('bearer')
export class MealRecordController {
    constructor(private readonly mealRecordService: MealRecordService) { }

    @Get()
    @ApiOperation({
        summary: 'Retrieve all meal records',
        description: 'Retrieve all meal records for the authenticated user'
    })
    @ApiOkResponse({
        description: 'The meal records have been successfully retrieved.',
        type: [MealRecord]
    })
    @ApiQuery({ name: 'patientId', required: false, description: 'Filter by patient ID' })
    @ApiQuery({ name: 'nutritionistId', required: false, description: 'Filter by nutritionist ID' })
    @ApiQuery({ name: 'dietId', required: false, description: 'Filter by diet ID' })
    @ApiQuery({ name: 'isCompleted', required: false, description: 'Filter by completion status' })
    @ApiQuery({
        name: 'date',
        required: false,
        description: 'Filter by meal relative date. Single date: "2025-09-17" or Date range: "[2025-09-01;2025-09-17]" or "[2025-09-01,2025-09-17]". Date order can be reversed.'
    })
    @UseGuards(JwtRoleGuard(['nutritionist', 'patient']))
    @UseFilters(ControllerExceptionFilter)
    async findAll(
        @Headers() headers: any,
        @Query('patientId') patientId?: string,
        @Query('nutritionistId') nutritionistId?: string,
        @Query('dietId') dietId?: string,
        @Query('isCompleted') isCompleted?: boolean,
        @Query('date') date?: string
    ): Promise<MealRecord[]> {
        const userRole = headers['role'];
        const userId = headers['user-id'];

        const query: any = {};
        if (patientId) query.patientId = patientId;
        if (nutritionistId) query.nutritionistId = nutritionistId;
        if (dietId) query.dietId = dietId;
        if (isCompleted !== undefined) query.isCompleted = isCompleted;

        // Date filtering - handle both single date and date range
        if (date) {
            try {
                // Check if it's a date range format: [start;end] or [start,end]
                if (date.startsWith('[') && date.endsWith(']') && (date.includes(';') || date.includes(','))) {
                    const rangeContent = date.slice(1, -1); // Remove brackets
                    const separator = date.includes(';') ? ';' : ',';
                    const [firstDateStr, secondDateStr] = rangeContent.split(separator);

                    const firstDate = new Date(firstDateStr.trim() + 'T00:00:00.000Z');
                    const secondDate = new Date(secondDateStr.trim() + 'T00:00:00.000Z');

                    // Validate dates
                    if (isNaN(firstDate.getTime()) || isNaN(secondDate.getTime())) {
                        throw new NotFoundException('Invalid date format in range. Use YYYY-MM-DD format.');
                    }

                    // Determine which date is earlier and which is later
                    let startDate, endDate;
                    if (firstDate <= secondDate) {
                        startDate = new Date(firstDate);
                        endDate = new Date(secondDate);
                    } else {
                        startDate = new Date(secondDate);
                        endDate = new Date(firstDate);
                    }

                    // Set proper time ranges using UTC
                    startDate = new Date(startDate.toISOString().split('T')[0] + 'T00:00:00.000Z');

                    // For end date, set to end of target day in UTC
                    endDate = new Date(endDate.toISOString().split('T')[0] + 'T23:59:59.999Z');

                    // console.log('Date range query:', {
                    //     startDate: startDate.toISOString(),
                    //     endDate: endDate.toISOString(),
                    //     firstDateStr: firstDateStr.trim(),
                    //     secondDateStr: secondDateStr.trim()
                    // });

                    // Use TypeORM Between for date range
                    const { Between } = await import('typeorm');
                    query.mealRelativeDate = Between(startDate, endDate);
                } else {
                    // Single date filtering - handle both quoted and unquoted dates
                    let dateStr = date;

                    // Remove quotes if present
                    if ((dateStr.startsWith('"') && dateStr.endsWith('"')) ||
                        (dateStr.startsWith("'") && dateStr.endsWith("'"))) {
                        dateStr = dateStr.slice(1, -1);
                    }

                    // Create date range for the entire day in UTC
                    const startDate = new Date(dateStr + 'T00:00:00.000Z');
                    const endDate = new Date(dateStr + 'T23:59:59.999Z');

                    // Validate date
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        throw new NotFoundException('Invalid date format. Use YYYY-MM-DD format.');
                    }

                    console.log('Single date query:', {
                        originalDate: date,
                        cleanedDate: dateStr,
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString()
                    });

                    // Use TypeORM Between for single date (entire day range)
                    const { Between } = await import('typeorm');
                    query.mealRelativeDate = Between(startDate, endDate);
                }
            } catch (error) {
                if (error instanceof NotFoundException) {
                    throw error;
                }
                throw new NotFoundException('Invalid date parameter format.');
            }
        }

        // Role-based filtering
        if (userRole === 'patient') {
            query.patientId = userId;
        } else if (userRole === 'nutritionist') {
            query.nutritionistId = userId;
        }

        return await this.mealRecordService.findAll(query);
    }

        @Post(':mealId')
    @ApiOperation({
        summary: 'Create a new meal record for a specific meal (simplified)',
        description: 'Create a new meal record when a patient consumes a meal. Only requires minimal information as meal details are fetched automatically.'
    })
    @ApiCreatedResponse({
        description: 'The meal record has been successfully created.',
        type: MealRecord
    })
    @UseGuards(JwtRoleGuard(['patient']))
    @UseFilters(ControllerExceptionFilter)
    async createForMeal(
        @Param('mealId') mealId: string,
        @Body() createPatientMealRecordDto: CreatePatientMealRecordDto,
        @Headers() headers: any
    ): Promise<MealRecord> {
        const patientId = headers['user-id'];
        return await this.mealRecordService.createPatientMealRecord(
            mealId,
            patientId,
            createPatientMealRecordDto.mealRelativeDate,
            createPatientMealRecordDto.mealRepeatDay,
            createPatientMealRecordDto.isCompleted || false
        );
    }

    // @Get(':id')
    // @ApiOperation({
    //     summary: 'Retrieve a specific meal record by ID',
    //     description: 'Retrieve a specific meal record by ID'
    // })
    // @ApiOkResponse({
    //     description: 'The meal record has been successfully retrieved.',
    //     type: MealRecord
    // })
    // @ApiNotFoundResponse({
    //     description: 'Meal record not found',
    // })
    // @ApiForbiddenResponse({
    //     description: 'User not allowed to access this meal record',
    // })
    // @UseGuards(JwtRoleGuard(['nutritionist', 'patient']))
    // @UseFilters(ControllerExceptionFilter)
    // async findById(
    //     @Param('id') id: string,
    //     @Headers() headers: any
    // ): Promise<MealRecord> {
    //     const mealRecord = await this.mealRecordService.findOne({ id });
    //     if (!mealRecord) {
    //         throw new NotFoundException('Meal record not found');
    //     }

    //     const userRole = headers['user-role'];
    //     const userId = headers['user-id'];

    //     // Check if user has access to this meal record
    //     const hasAccess = (userRole === 'patient' && mealRecord.patientId === userId) ||
    //         (userRole === 'nutritionist' && mealRecord.nutritionistId === userId);

    //     if (!hasAccess) {
    //         throw new ForbiddenException('User not allowed to access this meal record');
    //     }

    //     return mealRecord;
    // }

    // @Post()
    // @ApiOperation({
    //     summary: 'Create a new meal record',
    //     description: 'Create a new meal record when a patient consumes a meal'
    // })
    // @ApiCreatedResponse({
    //     description: 'The meal record has been successfully created.',
    //     type: MealRecord
    // })
    // @UseGuards(JwtRoleGuard(['patient']))
    // @UseFilters(ControllerExceptionFilter)
    // async create(
    //     @Body() createMealRecordDto: CreateMealRecordDto,
    //     @Headers() headers: any
    // ): Promise<MealRecord> {
    //     // Ensure the patient ID is set from the authenticated user
    //     createMealRecordDto.patientId = headers['user-id'];
    //     return await this.mealRecordService.createOne(createMealRecordDto);
    // }



    // @Put(':id')
    // @ApiOperation({
    //     summary: 'Update a specific meal record by ID',
    //     description: 'Update a specific meal record by ID'
    // })
    // @ApiOkResponse({
    //     description: 'The meal record has been successfully updated.',
    //     type: MealRecord
    // })
    // @ApiNotFoundResponse({
    //     description: 'Meal record not found',
    // })
    // @UseGuards(JwtRoleGuard(['nutritionist', 'patient']))
    // @UseFilters(ControllerExceptionFilter)
    // async update(
    //     @Param('id') id: string,
    //     @Body() updateMealRecordDto: UpdateMealRecordDto,
    //     @Headers() headers: any
    // ): Promise<MealRecord> {
    //     const existingRecord = await this.mealRecordService.findOne({ id });
    //     if (!existingRecord) {
    //         throw new NotFoundException('Meal record not found');
    //     }

    //     const userRole = headers['user-role'];
    //     const userId = headers['user-id'];

    //     // Check permissions
    //     const hasAccess = (userRole === 'patient' && existingRecord.patientId === userId) ||
    //         (userRole === 'nutritionist' && existingRecord.nutritionistId === userId);

    //     if (!hasAccess) {
    //         throw new ForbiddenException('User not allowed to update this meal record');
    //     }

    //     // Patients can only update completion status
    //     if (userRole === 'patient') {
    //         const allowedFields = { isCompleted: updateMealRecordDto.isCompleted };
    //         return await this.mealRecordService.updateOne({ id }, allowedFields);
    //     }

    //     return await this.mealRecordService.updateOne({ id }, updateMealRecordDto);
    // }

    // @Put(':id/complete')
    // @ApiOperation({
    //     summary: 'Mark a meal record as completed',
    //     description: 'Mark a meal record as completed by the patient'
    // })
    // @ApiOkResponse({
    //     description: 'The meal record has been marked as completed.',
    //     type: MealRecord
    // })
    // @ApiNotFoundResponse({
    //     description: 'Meal record not found',
    // })
    // @UseGuards(JwtRoleGuard(['patient']))
    // @UseFilters(ControllerExceptionFilter)
    // async markAsCompleted(
    //     @Param('id') id: string,
    //     @Headers() headers: any
    // ): Promise<MealRecord> {
    //     const existingRecord = await this.mealRecordService.findOne({ id });
    //     if (!existingRecord) {
    //         throw new NotFoundException('Meal record not found');
    //     }

    //     const userId = headers['user-id'];

    //     // Only the patient who owns the record can mark it as complete
    //     if (existingRecord.patientId !== userId) {
    //         throw new ForbiddenException('User not allowed to update this meal record');
    //     }

    //     return await this.mealRecordService.markAsCompleted(id);
    // }

    // @Put(':id/incomplete')
    // @ApiOperation({
    //     summary: 'Mark a meal record as incomplete',
    //     description: 'Mark a meal record as incomplete'
    // })
    // @ApiOkResponse({
    //     description: 'The meal record has been marked as incomplete.',
    //     type: MealRecord
    // })
    // @ApiNotFoundResponse({
    //     description: 'Meal record not found',
    // })
    // @UseGuards(JwtRoleGuard(['patient']))
    // @UseFilters(ControllerExceptionFilter)
    // async markAsIncomplete(
    //     @Param('id') id: string,
    //     @Headers() headers: any
    // ): Promise<MealRecord> {
    //     const existingRecord = await this.mealRecordService.findOne({ id });
    //     if (!existingRecord) {
    //         throw new NotFoundException('Meal record not found');
    //     }

    //     const userId = headers['user-id'];

    //     // Only the patient who owns the record can mark it as incomplete
    //     if (existingRecord.patientId !== userId) {
    //         throw new ForbiddenException('User not allowed to update this meal record');
    //     }

    //     return await this.mealRecordService.markAsIncomplete(id);
    // }
}
