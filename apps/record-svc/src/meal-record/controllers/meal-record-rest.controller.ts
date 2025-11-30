import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Headers,
    UseGuards,
    UseFilters,
    NotFoundException,
    Query,
    Inject,
    UseInterceptors
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiSecurity,
    ApiQuery,
    ApiParam,
    ApiNotFoundResponse, ApiBody
} from '@nestjs/swagger';
import { MealRecordService } from '../meal-record.service';
import {
    MealRecord,
    JwtRoleGuard,
    ControllerExceptionFilter, ContextUser,
    DIET_SERVICE_PROXY_NAME,
    sendProxyMessage, proxyPattern,
    SchedulerHelper,
    GenerateAccessResponse,
    LoggingInterceptor
} from '@backend-evolved/shared';
import { ClientProxy } from '@nestjs/microservices';

@Controller('/meal')
@ApiBearerAuth('bearer')
@ApiSecurity('bearer')
export class MealRecordRestController {
    constructor(
        private readonly mealRecordService: MealRecordService,
        @Inject(DIET_SERVICE_PROXY_NAME)
        private readonly dietServiceProxy: ClientProxy
    ) { }

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
    @ApiBody({
        description: 'Payload to create a new meal record. If no date/time is provided, date/time of the request will be used.',
        schema: {
            type: 'object',
            properties: {
                date: {
                    type: 'string',
                    description: 'The relative date when this meal should be consumed (only date part, time will be ignored). Format: "2025-09-17"',
                    example: '2025-09-17'
                },
                time: {
                    type: 'string',
                    description: 'The time when this meal should be consumed (only time part, date will be ignored). Format: "14:30:00"',
                    example: '12:30'
                }
            },
        },
        examples: {
            withTimeAsProperty: {
                summary: 'With time as separate property',
                value: { date: '2025-09-17', time: '12:30' }
            },
            withTimeInDate: {
                summary: 'With time included in date',
                value: { date: '2025-09-17T12:30:00.000Z' }
            },
            onlyDate: {
                summary: 'Only date',
                value: { date: '2025-09-17' }
            }
        },
        required: false
    })
    @ApiParam({ name: 'mealId', description: 'ID of the meal to create a new record' })
    @ApiOperation({
        summary: 'Create a new meal record for a specific meal',
        description: 'Create a new meal record when a patient consumes a meal. Only requires minimal information as meal details are fetched automatically.'
    })
    @ApiCreatedResponse({
        description: 'The meal record has been successfully created/updated. If a record for the same meal and date exists, property "isCompleted" will be updated instead.',
        type: MealRecord,
        example: {
            id: 'record-id-123',
            mealId: 'meal-id-456',
            patientId: 'patient-id-789',
            nutritionistId: 'nutritionist-id-101',
            dietId: 'diet-id-112',
            mealRelativeDate: '2025-09-17T12:00:00.000Z',
            isCompleted: true,
            createdAt: '2025-09-17T12:30:00.000Z',
            updatedAt: '2025-09-17T12:45:00.000Z'
        }
    })
    @GenerateAccessResponse()
    @UseGuards(JwtRoleGuard(['patient']))
    @UseFilters(ControllerExceptionFilter)
    @UseInterceptors(LoggingInterceptor)
    async trackMealRecord(
        @Param('mealId') mealId: string,
        @Body() body: { date: string, time?: string },
        @ContextUser() ctxUser: ContextUser,
    ): Promise<any> {
        const foundMeal = await sendProxyMessage<
            typeof proxyPattern.diet.meal.getOne.response,
            typeof proxyPattern.diet.meal.getOne.payload
        >({
            proxy: this.dietServiceProxy,
            pattern: proxyPattern.diet.meal.getOne.key,
            data: {
                mealId,
                patientId: ctxUser.id
            }
        });

        return await this.mealRecordService.createOrUpdate(
            foundMeal,
            body.date,
            body.time
        );
    }

    @Get(':mealId')
    @ApiOperation({
        summary: 'Retrieve meal records for a specific meal',
        description: 'Retrieve all meal records associated with a specific meal ID. Optionally filter by meal relative date.'
    })
    @ApiParam({ name: 'mealId', description: 'ID of the meal to retrieve records for' })
    @ApiQuery({ name: 'date', required: false, description: 'Filter by meal relative date. Format: "2025-09-17"' })
    @ApiOkResponse({
        description: 'The available meal records for this particular mealId.',
        type: [MealRecord],
        examples: {
            multipleRecords: {
                summary: 'Multiple Records',
                value: [
                    {
                        id: 'record-id-1',
                        mealId: 'meal-id-123',
                        patientId: 'patient-id-456',
                        nutritionistId: 'nutritionist-id-789',
                        dietId: 'diet-id-101',
                        mealRelativeDate: '2025-09-17T12:00:00.000Z',
                        isCompleted: true,
                        createdAt: '2025-09-17T12:30:00.000Z',
                        updatedAt: '2025-09-17T12:45:00.000Z'
                    },
                    {
                        id: 'record-id-2',
                        mealId: 'meal-id-123',
                        patientId: 'patient-id-456',
                        nutritionistId: 'nutritionist-id-789',
                        dietId: 'diet-id-101',
                        mealRelativeDate: '2025-09-18T12:00:00.000Z',
                        isCompleted: false,
                        createdAt: '2025-09-18T12:30:00.000Z',
                        updatedAt: '2025-09-18T12:45:00.000Z'
                    }
                ]
            },
            emptyRecords: {
                summary: 'No Records',
                value: []
            }
        }
    })
    @ApiNotFoundResponse({
        description: 'Meal not found',
        example: {
            statusCode: 404,
            message: 'Meal not found',
            error: 'Not Found'
        }
    })
    @GenerateAccessResponse()
    @UseGuards(JwtRoleGuard(['patient', 'nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async getMealRecord(
        @Param('mealId') mealId: string,
        @Query('date') date: string,
        @ContextUser() ctxUser: ContextUser,
    ) {
        const foundMeal = await sendProxyMessage<
            typeof proxyPattern.diet.meal.getOne.response,
            typeof proxyPattern.diet.meal.getOne.payload
        >({
            proxy: this.dietServiceProxy,
            pattern: proxyPattern.diet.meal.getOne.key,
            data: {
                mealId,
                patientId: ctxUser.id
            }
        });
        const scheduler = new SchedulerHelper(foundMeal.diet.timeZone);
        const payload: any = {
            mealId: foundMeal.id,
        };

        if (date) {
            const targetDate = scheduler.buildDate({ date, startOfDay: true });
            payload['mealRelativeDate'] = targetDate;
        }

        return await this.mealRecordService.findAll(payload);
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
