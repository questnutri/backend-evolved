import { Post, Body, Controller, Headers } from '@nestjs/common';
import { FoodService } from './food.service';
import { CreateFoodDto } from '@backend-evolved/shared';

@Controller('food')
export class FoodController {
    constructor(private readonly foodService: FoodService) { }

    @Post()
    async postOne(@Body() createFoodDto: CreateFoodDto) {
        return await this.foodService.create(createFoodDto);
    }

}
