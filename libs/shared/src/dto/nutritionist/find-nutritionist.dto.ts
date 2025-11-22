import { IntersectionType } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { Nutritionist } from "../../entities";
import { SearchDto } from "../search/search.dto";

export class NutritionistIncludeOptions {
    @IsOptional()
    includePatients?: boolean;
    
    @IsOptional()
    includeDiets?: boolean;
}

export class NutritionistFindOptions extends
    IntersectionType(
        SearchDto<Nutritionist>,
        NutritionistIncludeOptions
    ) {
}