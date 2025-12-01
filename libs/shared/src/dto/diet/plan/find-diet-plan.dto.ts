import { IntersectionType } from "@nestjs/swagger";
import { Diet } from "../../../entities";

export class DietPlanQueryOptions {
    length?: number = 1;
    monthlyView?: boolean;
    date?: Date;
}

export class DietPlanIncludeOptions {
    includeRecords?: boolean;
    dontIncludeAliments?: boolean;
}

export class DietPlanFindOptions extends IntersectionType(
    DietPlanIncludeOptions,
    DietPlanQueryOptions
) {
    diet: Diet;
}