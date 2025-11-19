import { Headers, Body, Controller, Get, Post, UseGuards, ForbiddenException, Param, NotFoundException, Put, Delete, UseFilters, Query, BadRequestException } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiSecurity,
    ApiQuery,
    ApiBody,
    ApiTags,
    ApiExcludeEndpoint
} from '@nestjs/swagger';
import { DietService } from '../diet.service';
import {
    ControllerExceptionFilter,
    CreateDietDto, Diet,
    JwtRoleGuard,
    UpdateDietDto,
    DietPlan,
    ContextUser,
    DietRequestBody,
    ProxyMessengerFilter,
    proxyPattern,
    ProxyMessage,
    IsRelatedGuard,
    ensureUserRelatedOrThrow,
    UserRole,
    GenerateBadRequestResponse,
    GenerateAccessResponse
} from '@backend-evolved/shared';
import { FoodService } from '../../food/food.service';
import { MealService } from '../../meal/meal.service';

// Use a UTC-based date-only formatter here to avoid timezone shifts
function toDateOnlyString(date: Date | string | number): string {
    const d = new Date(date);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

@Controller()
@ApiTags('Diets')
@ApiBearerAuth('bearer')
@ApiSecurity('bearer')
export class DietRestController {
    constructor(
        private readonly dietService: DietService,
        private readonly foodService: FoodService,
        private readonly mealService: MealService
    ) { }

    // Helper: map startDate/endDate on Diet and relativeDate on DietPlan dayPlans
    private mapDietDates(diet: any): any {
        if (!diet) return diet;
        if (diet.startDate) diet.startDate = toDateOnlyString(diet.startDate);
        if (diet.endDate) diet.endDate = toDateOnlyString(diet.endDate);
        return diet;
    }

    private mapDietPlanDates(plans: DietPlan[] | any): DietPlan[] {
        if (!plans || !Array.isArray(plans)) return plans;
        return plans.map(plan => ({
            ...plan,
            dayPlans: Array.isArray(plan.dayPlans) ? plan.dayPlans.map((dp: any) => ({
                ...dp,
                relativeDate: toDateOnlyString((dp as any).relativeDate)
            })) : plan.dayPlans
        }));
    }

    @Get('health')
    @ApiExcludeEndpoint()
    healthCheck() {
        return { active: true };
    }

    @Get()
    @ApiOperation({
        summary: 'Get all diets',
        description: 'Retrieve all diets filtered by patientId and/or nutritionistId. Returns date-only startDate/endDate fields (YYYY-MM-DD, UTC).'
    })
    @ApiBody({
        type: DietRequestBody,
        required: true,
        description: 'Filter object. Nutritionists must provide patientId; patients can omit patientId (will be inferred).',
        schema: {
            example: {
                patientId: 'b6f9c2a4-1111-4444-aaaa-bb2c3d4e5f67',
                nutritionistId: 'ntr-1234-5678-90ab-cdef'
            }
        }
    })
    @ApiOkResponse({
        description: 'Array of Diet objects with date-only startDate/endDate',
        schema: {
            example: [
                {
                    id: 'diet-1111-2222-3333',
                    name: 'Weight Loss Plan',
                    patientId: 'b6f9c2a4-1111-4444-aaaa-bb2c3d4e5f67',
                    nutritionistId: 'ntr-1234-5678-90ab-cdef',
                    startDate: '2025-11-01',
                    endDate: '2025-11-15',
                    meals: []
                }
            ]
        }
    })
    @UseGuards(
        JwtRoleGuard(['nutritionist', 'patient']),
        IsRelatedGuard({
            on: 'query',
            withKeys: ['patientId', 'nutritionistId'],
            errorMessage: (role: UserRole) => {
                if (role === 'patient') {
                    return 'Patients can only access their own diets.';
                }
                return 'Nutritionists can only access diets of their patients.';
            }
        })
    )
    @UseFilters(ControllerExceptionFilter)
    async getAllDiets(
        @Query('patientId') patientId: string,
        @Query('nutritionistId') nutritionistId: string,
    ): Promise<Diet[]> {
        const diets = await this.dietService.findAll({ patientId, nutritionistId });
        return diets.map(diet => this.mapDietDates(diet));
    }

    /**
     * Create a full diet structure in a single request.
     * Expected payload shape:
     * {
     *   name?: string,
     *   description?: string,
     *   patientId: string,
     *   startDate?: Date | string (YYYY-MM-DD),
     *   endDate?: Date | string (YYYY-MM-DD),
     *   meals?: [ { name, description?, hour?, repeatConfiguration?, foods?: [ { alimentId?, quantity?, portion?, description? } ] } ]
     * }
     */
    @Post('full')
    @ApiOperation({ summary: 'Create a full diet with meals and foods', description: 'Create diet, its meals and foods in a single JSON payload. The authenticated nutritionist will be set as nutritionistId.' })
    @ApiBody({
        required: true,
        schema: {
            example: {
                name: 'November Plan',
                description: '14-day sample plan',
                patientId: 'b6f9c2a4-1111-4444-aaaa-bb2c3d4e5f67',
                startDate: '2025-11-01',
                endDate: '2025-11-15',
                meals: [
                    {
                        name: 'Dinner',
                        hour: '19:00',
                        repeatConfiguration: {
                            type: 'WEEKLY',
                            daysOfWeek: [1, 2] // Monday, Tuesday (DayOfWeek numbering uses JS getUTCDay mapping)
                        },
                        foods: [
                            { alimentId: 'alim-123', quantity: 1 }
                        ]
                    }
                ]
            }
        }
    })
    @ApiCreatedResponse({
        description: 'The diet and nested resources have been successfully created. startDate/endDate are returned as YYYY-MM-DD strings',
        type: Diet
    })
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async createFullDiet(
        @Body() payload: any,
        @ContextUser() ctxUser: ContextUser,
    ): Promise<any> {
        // Ensure startDate default
        if (!payload.startDate) payload.startDate = new Date();
        // Attach nutritionistId from authenticated user
        payload.nutritionistId = ctxUser.id;

        const createdMeals: any[] = [];
        const createdFoods: any[] = [];
        let createdDiet: any = null;
        try {
            // Create diet
            createdDiet = await this.dietService.createOne(payload);

            // If there are meals, create them and their foods
            if (payload.meals && Array.isArray(payload.meals)) {
                for (const mealPayload of payload.meals) {
                    const mealToCreate = { ...mealPayload, diet: createdDiet };
                    const createdMeal = await this.mealService.createOne(mealToCreate);
                    createdMeals.push(createdMeal);
                    if (mealPayload.foods && Array.isArray(mealPayload.foods)) {
                        for (const foodPayload of mealPayload.foods) {
                            const foodToCreate = { ...foodPayload, meal: createdMeal };
                            const createdFood = await this.foodService.createOne(foodToCreate as any);
                            createdFoods.push(createdFood);
                        }
                    }
                }
            }

            // Return the full created structure
            const dietWithRelations = await this.dietService.findOneWhere({ id: createdDiet.id });
            const publicDiet = await this.dietService.fetchDietAlimentsPublic(dietWithRelations as Diet);
            return this.mapDietDates(publicDiet);
        } catch (err) {
            // Attempt compensation: delete created foods, meals and diet where possible
            try {
                for (const f of createdFoods) {
                    if (f && f.id) await this.foodService.deleteOne({ id: f.id } as any);
                }
            } catch (e) {
                // swallow
            }
            try {
                for (const m of createdMeals) {
                    if (m && m.id) await this.mealService.delete(m.id);
                }
            } catch (e) {
                // swallow
            }
            try {
                if (createdDiet && createdDiet.id) await this.dietService.deleteOne({ id: createdDiet.id });
            } catch (e) {
                // swallow
            }
            throw err;
        }
    }

    @Post('plan')
    @ApiOperation({
        summary: 'Get complex diet plan for a patient',
        description: 'Retrieve a comprehensive diet plan with calendar planning for a specific patient, including meal schedules and records. Dates are returned as YYYY-MM-DD (UTC) and meals include their configured hour separately.'
    })
    @ApiQuery({
        name: 'length',
        description: 'Number of months to include (default: 1 = current month + 1 back + 1 forward)',
        required: false,
        type: Number
    })
    @ApiBody({
        type: DietRequestBody,
        required: true,
        description: 'Request must include patientId (nutritionists) or will be inferred (patients).',
        schema: {
            example: {
                patientId: 'b6f9c2a4-1111-4444-aaaa-bb2c3d4e5f67'
            }
        }
    })
    @ApiOkResponse({
        description: 'Diet plan has been successfully generated. relativeDate values are date-only strings (YYYY-MM-DD) and each meal includes its hour. Example truncated response:',
        schema: {
            example: [
                {
                    dietId: 'diet-1111-2222-3333',
                    dayPlans: [
                        {
                            relativeDate: '2025-11-03', // Monday
                            mealPlans: [
                                {
                                    meal: {
                                        id: 'dcf11dca-bdd1-4426-8fa3-128bcc35880b',
                                        name: 'Dinner',
                                        hour: '19:00',
                                        repeatConfiguration: { type: 'WEEKLY', interval: 1, daysOfWeek: [1, 2] },
                                        foods: []
                                    },
                                    mealRecord: null
                                }
                            ]
                        },
                        {
                            relativeDate: '2025-11-04', // Tuesday
                            mealPlans: [ /* ... */]
                        }
                    ]
                }
            ]
        }
    })
    @ApiForbiddenResponse({
        description: 'User not allowed to access this diet plan',
    })
    @UseGuards(
        JwtRoleGuard(['nutritionist', 'patient']),
        IsRelatedGuard({
            on: 'body',
            withKeys: ['patientId', 'nutritionistId'],
            errorMessage: (role: UserRole) => {
                if (role === 'patient') {
                    return 'Patients can only access their own diet plans.';
                }
                if (role === 'nutritionist') {
                    return 'Nutritionists can only access diet plans of their patients.';
                }
                return 'Access denied.';
            },
        })
    )
    @UseFilters(ControllerExceptionFilter)
    async getDietPlan(
        @Body() body: DietRequestBody,
        @Query('length') length?: number,
    ): Promise<DietPlan[]> {
        const planLength = length && length > 0 ? length : 1;
        const rawPlans = await this.dietService.getDietPlanForPatient(body.patientId, body.nutritionistId, planLength);
        return this.mapDietPlanDates(rawPlans);
    }

    @Post()
    @ApiOperation({
        summary: 'Create a new diet',
        description: `Create a new diet for a given patient.
**Diet fallback description:**
- **\`startDate\`**: If is omitted, it defaults to request date (UTC);

- **\`timeZone\`**: If omitted, it defaults to -3 (UTC-3) Brasilia time zone.;

- **\`endDate\`**: 
    - If omitted, the diet will not expire (endDate = null);
    - If provided, make sure that you provide a valid \`startDate\`, and if you don't provide \`startDate\`, \`endDate\` must be after request date (UTC).
`
    })
    @ApiCreatedResponse({
        description: 'The diet has been successfully created.',
        type: Diet,
        examples: {
            noEndDate: {
                summary: 'Diet without endDate',
                value: {
                    id: 'diet-uuid-1111-2222-3333',
                    name: 'Weight Gain Plan',
                    patientId: 'patient-uuid-1111-2222-3333',
                    nutritionistId: 'nutritionist-uuid-1111-2222-3333',
                    startDate: '2025-12-01T03:00:00.000Z',
                    endDate: null,
                    timeZone: -3,
                    description: "A diet plan focused on healthy weight gain.",
                    createdAt: "2025-11-19T06:02:14.885Z",
                    updatedAt: "2025-11-19T06:02:14.885Z"
                }
            },
            withEndDate: {
                summary: 'Diet with endDate',
                value: {
                    id: 'diet-uuid-1111-2222-3333',
                    name: 'Weight Gain Plan',
                    patientId: 'patient-uuid-1111-2222-3333',
                    nutritionistId: 'nutritionist-uuid-1111-2222-3333',
                    startDate: '2025-12-01T03:00:00.000Z',
                    endDate: '2026-01-01T03:00:00.000Z',
                    timeZone: -3,
                    description: "A diet plan focused on healthy weight gain.",
                    createdAt: "2025-11-19T06:02:14.885Z",
                    updatedAt: "2025-11-19T06:02:14.885Z"
                }
            }
        }
    })
    @ApiNotFoundResponse({
        description: 'Patient not found',
        example: {
            "message": "Patient not found or not related to the nutritionist",
            "error": "Not Found",
            "statusCode": 404
        }
    })
    @GenerateBadRequestResponse({
        description: 'Invalid body data',
        requests: {
            endDateBeforeStartDate: "Diet endDate (2025-11-18) cannot be before startDate (2025-11-19).",
            startDateInPast: "Diet startDate (2025-11-15) cannot be in the past."
        },
        dto: CreateDietDto,
        includeInvalidKeyword: {
            onRequests: false,
            onDto: true
        }
    })
    @GenerateAccessResponse()
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async createDiet(
        @Body() createDietDto: CreateDietDto,
        @ContextUser() ctxUser: ContextUser,
    ): Promise<Diet> {
        return await this.dietService.createOne({ ...createDietDto, nutritionistId: ctxUser.id, timeZone: createDietDto.timeZone ?? -3 });
    }

    @Get(':dietId')
    @ApiOperation({
        summary: 'Retrieve a specific diet by ID',
        description: 'Retrieve a specific diet by ID if user (patient or nutritionist) is related to that diet.'
    })
    @ApiOkResponse({
        description: 'The diet has been successfully retrieved.',
        type: Diet,
        example: {
            id: 'diet-uuid-1111-2222-3333',
            name: 'Weight Gain Plan',
            patientId: 'patient-uuid-1111-2222-3333',
            nutritionistId: 'nutritionist-uuid-1111-2222-3333',
            startDate: '2025-12-01T03:00:00.000Z',
            endDate: '2026-01-01T02:59:59.000Z',
            timeZone: -3,
            description: "A diet plan focused on healthy weight gain.",
            createdAt: "2025-11-19T06:02:14.885Z",
            updatedAt: "2025-11-19T06:02:14.885Z",
            meals: []
        }
    })
    @ApiNotFoundResponse({
        description: 'Diet not found',
        example: {
            "message": "Diet not found or not related to user",
            "error": "Not Found",
            "statusCode": 404
        }
    })
    @GenerateAccessResponse()
    @UseGuards(JwtRoleGuard(['nutritionist', 'patient']))
    @UseFilters(ControllerExceptionFilter)
    async findById(
        @Param('dietId') dietId: string,
        @ContextUser() ctxUser: ContextUser,
    ): Promise<Diet> {
        const diet = await this.dietService.findOneWhere({ id: dietId });
        if (!diet) {
            throw new NotFoundException("Diet not found");
        }

        ensureUserRelatedOrThrow(
            ctxUser,
            { body: { patientId: diet.patientId, nutritionistId: diet.nutritionistId } },
            {
                withKeys: ['patientId', 'nutritionistId'],
                adminBypass: true
            }
        )

        return await this.dietService.fetchDietAlimentsPublic(diet);
    }


    @Get(':dietId/plan')
    async getDietPlanById(
        @Param('dietId') dietId: string
    ) {
        const diet = await this.dietService.findOneWhere({ id: dietId });
        if (diet) {
            this.dietService.getDietPlan(diet);
        }
    }


    @Put(':dietId')
    @ApiOperation({
        summary: 'Update a specific diet by ID',
        description: 'Update fields of an existing diet. Only nutritionists who created the diet can update it.'
    })
    @ApiOkResponse({
        description: 'The diet has been successfully updated.',
        type: Diet
    })
    @ApiNotFoundResponse({
        description: 'Diet not found',
    })
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async updateDiet(
        @Param('dietId') dietId: string,
        @Body() updateDietDto: UpdateDietDto,
        @Headers() headers: any
    ): Promise<Diet> {
        return await this.dietService.updateOne({ id: dietId }, updateDietDto);
    }

    @Delete(':dietId')
    @ApiOperation({
        summary: 'Delete a specific diet by ID',
        description: 'Delete a specific diet. Only nutritionists who created the diet can delete it.'
    })
    @ApiNoContentResponse({
        description: 'The diet has been successfully deleted.',
    })
    @ApiNotFoundResponse({
        description: 'Diet not found',
    })
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async deleteDiet(
        @Param('dietId') dietId: string,
        @Headers() headers: any
    ): Promise<void> {
        return await this.dietService.deleteOne({ id: dietId });
    }

}