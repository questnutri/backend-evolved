import { IntersectionType } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { Patient } from "../../entities";
import { SearchDto } from "../search/search.dto";
import { DietIncludeOptions } from "../diet/find-diet.dto";

export class PatientIncludeOptions extends IntersectionType(DietIncludeOptions) {
    @IsOptional()
    includeNutritionists?: boolean;
    @IsOptional()
    includeDiets?: boolean;
    @IsOptional()
    includeLastWeight?: boolean;
}

export class PatientFindOptions extends
    IntersectionType(
        SearchDto<Patient>,
        PatientIncludeOptions
    ) {
}