import { IntersectionType } from "@nestjs/swagger";
import { Diet } from "../../entities";
import { SearchDto } from "../search";

export class DietIncludeOptions {
    includeMeals?: boolean;
    includeFoods?: boolean;
}

export class DietFindOptions
    extends IntersectionType(SearchDto<Diet>, DietIncludeOptions)
{
    removeKey?: (keyof Diet)[];
}