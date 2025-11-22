import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseFilters, Query } from '@nestjs/common';
import { WeightRecordService } from '../weight-record.service';
import { CreateWeightRecordDto } from '../dto/create-weight-record.dto';
import { UpdateWeightRecordDto } from '../dto/update-weight-record.dto';
import { ApiBasicAuth, ApiBearerAuth, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { ContextUser, ControllerExceptionFilter, FindWeightOptions, JwtRoleGuard, PaginationQuery } from '@backend-evolved/shared';

@Controller('weight')
export class WeightRecordRestController {
    constructor(private readonly weightRecordService: WeightRecordService) { }

    @Post()
    @ApiOperation({
        summary: 'Create a new weight record',
        description: 'Creates a new weight record for a patient.'
    })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['patient']))
    @UseFilters(ControllerExceptionFilter)
    async create(
        @ContextUser() ctxUser: ContextUser,
        @Body() createWeightRecordDto: CreateWeightRecordDto
    ) {
        return await this.weightRecordService.create({
            patientId: ctxUser.id,
            ...createWeightRecordDto
        });
    }

    @Get('patient/:patientId')
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
        @Query() query: PaginationQuery,
        @ContextUser() ctxUser: ContextUser
    ) {
        return await this.weightRecordService.findAll({
            patientId: ctxUser.id,
            ...query
        });
    }



}
