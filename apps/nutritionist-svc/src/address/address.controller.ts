import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseFilters, UseGuards } from '@nestjs/common';
import { AddressService } from './address.service';
import { ApiOperation, ApiBearerAuth, ApiSecurity, ApiCreatedResponse } from '@nestjs/swagger';
import {
    ContextUser,
    ControllerExceptionFilter,
    CreateAddressDto,
    GenerateAccessResponse,
    GenerateApiPaginationQuery,
    JwtRoleGuard,
    PaginationQuery
} from '@backend-evolved/shared';
import { NutritionistService } from '../nutritionist/nutritionist.service';

@Controller('address')
export class AddressController {
    constructor(
        private readonly addressService: AddressService,
        private readonly nutritionistService: NutritionistService,
    ) { }

    @Post()
    @ApiOperation({
        summary: 'Create a new address for a logged nutritionist',
    })
    @ApiCreatedResponse({
        description: 'Address created successfully',

    })
    @GenerateAccessResponse()
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async postAddress(
        @Body() body: CreateAddressDto,
        @ContextUser() ctxUser: ContextUser
    ) {
        const address = await this.addressService.createAddress({
            ...body,
            nutritionistId: ctxUser.id
        });
        return address;
    }

    @Get('all')
    @ApiOperation({
        summary: 'Get all addresses for a logged nutritionist',
    })
    @GenerateAccessResponse()
    @GenerateApiPaginationQuery()
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async getAllAddresses(
        @ContextUser() ctxUser: ContextUser,
        @Query() query: PaginationQuery
    ) {
        return await this.addressService.findAll({
            where: {
                nutritionistId: ctxUser.id
            },
            ...query
        });
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get a specific address by ID for a logged nutritionist',
    })
    @GenerateAccessResponse()
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async getAddressById(
        @ContextUser() ctxUser: ContextUser,
        @Query() query: PaginationQuery,
        @Param('id') id: string
    ) {
        return await this.addressService.findOne({
            where: {
                id,
                nutritionistId: ctxUser.id
            },
            ...query
        });
    }

    @Post(':id/main')
    @ApiOperation({
        summary: 'Set an address as the main address for a logged nutritionist',
    })
    @GenerateAccessResponse()
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async setMainAddress(
        @ContextUser() ctxUser: ContextUser,
        @Param('id') id: string
    ) {

        const foundAddress = await this.addressService.findOne({
            where: {
                id,
                nutritionistId: ctxUser.id
            },
            removeKeys: ['nutritionist', 'nutritionistId']
        });

        const foundNutritionist = await this.nutritionistService.findOne({
            where: {
                id: ctxUser.id
            },
        });

        return await this.nutritionistService.updateOne(foundNutritionist, {
            mainAddress: foundAddress.id
        });

    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update an address by ID for a logged nutritionist',
    })
    @GenerateAccessResponse()
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async updateAddressById(
        @ContextUser() ctxUser: ContextUser,
        @Param('id') id: string,
        @Body() body: Partial<CreateAddressDto>
    ) {
        (body as any)['nutritionistId'] = ctxUser.id;
        const foundAddress = await this.addressService.findOne({
            where: {
                id,
                nutritionistId: ctxUser.id
            },
        });
        return await this.addressService.updateOne(foundAddress, body);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({
        summary: 'Delete an address by ID for a logged nutritionist',
    })
    @GenerateAccessResponse()
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async deleteAddressById(
        @ContextUser() ctxUser: ContextUser,
        @Param('id') id: string
    ) {
        const foundAddress = await this.addressService.findOne({
            where: {
                id,
                nutritionistId: ctxUser.id
            },
            relations: ['nutritionist']
        });
        if(foundAddress.nutritionist.mainAddress && foundAddress.nutritionist.mainAddress === foundAddress.id) {
            await this.nutritionistService.updateOne(foundAddress.nutritionist, {
                mainAddress: null
            });
        }
        await this.addressService.deleteOne(foundAddress);
    }
}