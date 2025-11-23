import { Controller, Get, Post, Body, Param, UseGuards, UseFilters, Query, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { WeightRecordService } from '../weight-record.service';
import { CreateWeightRecordDto } from '../dto/create-weight-record.dto';
import { ApiBearerAuth, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import {
    ContextUser,
    ControllerExceptionFilter,
    errorMessagePattern,
    FindWeightOptions,
    JwtRoleGuard,
    ListResponse,
    PaginationQuery,
    PATIENT_SERVICE_PROXY_NAME,
    proxyPattern,
    sendProxyMessage,
    UserRole,
    WeightRecord
} from '@backend-evolved/shared';
import { ClientProxy } from '@nestjs/microservices';

@Controller('weight')
export class WeightRecordRestController {
    constructor(
        private readonly weightRecordService: WeightRecordService,
        @Inject(PATIENT_SERVICE_PROXY_NAME) private readonly patientServiceProxy: ClientProxy
    ) { }

    @Post()
    @ApiOperation({
        summary: 'Create a new weight record',
        description: 'Creates a new weight record for a patient.'
    })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['patient', 'nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async create(
        @ContextUser() ctxUser: ContextUser,
        @Body() createWeightRecordDto: CreateWeightRecordDto
    ) {
        let patientId;
        if (ctxUser.role === UserRole.NUTRITIONIST) {
            if (!createWeightRecordDto.patientId) {
                throw new BadRequestException(
                    errorMessagePattern.record.weight.patientIdIsRequired.fn()
                )
            }
            const isRelated = await sendProxyMessage<
                typeof proxyPattern.patient.isRelatedToNutritionist.response,
                typeof proxyPattern.patient.isRelatedToNutritionist.payload
            >({
                proxy: this.patientServiceProxy,
                pattern: proxyPattern.patient.isRelatedToNutritionist.key,
                data: {
                    nutritionistId: ctxUser.id,
                    patientId: createWeightRecordDto.patientId
                }
            })
            if (!isRelated) {
                throw new NotFoundException(
                    errorMessagePattern
                        .patient
                        .notFound
                        .fn()
                )
            }
            patientId = createWeightRecordDto.patientId;
        } else {
            patientId = ctxUser.id;
        }
        return await this.weightRecordService.create({
            ...createWeightRecordDto,
            patientId,
        },
            ctxUser
        );
    }

    @Get('patient/:patientId/all')
    @ApiOperation({
        summary: 'Get all weight records for the authenticated patient',
        description: 'Retrieves all weight records associated with the authenticated patient.'
    })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['patient']))
    @UseFilters(ControllerExceptionFilter)
    async findAll(
        @Param('patientId') patientId: string,
        @Query() query: FindWeightOptions & PaginationQuery,
        @ContextUser() ctxUser: ContextUser
    ): Promise<ListResponse<WeightRecord>> {
        return await this.weightRecordService.findAll(
            ctxUser,
            {
                patientId,
                ...query
            });
    }

}