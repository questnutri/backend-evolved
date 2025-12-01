import { IntersectionType } from "@nestjs/swagger";
import { Diet } from "../../entities";
import { SearchDto } from "../search";

export class DietIncludeOptions {
    includeMeals?: boolean;
    includeFoods?: boolean;
    includeCompliance?: boolean;
}

export class DietFindOptions
    extends IntersectionType(
        SearchDto<Diet>,
        DietIncludeOptions
    )
{
    order?: { [P in keyof Diet]?: "ASC" | "DESC" };
    removeKey?: (keyof Diet)[];
}