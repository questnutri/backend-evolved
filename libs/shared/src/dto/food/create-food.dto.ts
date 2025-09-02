import { UpdateFoodDto } from "./update-food.dto";
import { InputType } from "@nestjs/graphql";

@InputType()
export class CreateFoodDto extends UpdateFoodDto {}