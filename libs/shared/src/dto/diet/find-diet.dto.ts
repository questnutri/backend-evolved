import { IntersectionType } from "@nestjs/swagger";
import { Diet } from "../../entities";


export class DietIncludeOptions {
    includeMeals?: boolean;
    includeFoods?: boolean;
}

export class DietFindOptions extends IntersectionType(DietIncludeOptions) {
    removeKey?: (keyof Diet)[];
}