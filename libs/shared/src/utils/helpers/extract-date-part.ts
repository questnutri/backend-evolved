import { InternalServerErrorException } from "@nestjs/common";
import { errorMessagePattern } from "../../patterns";
import { DateConditionOperation } from "../../entities";

export function extractDatePart(date: Date, part: DateConditionOperation): number {
    if (!date) {
        throw new InternalServerErrorException(
            errorMessagePattern
                .game
                .trigger
                .invalidTriggerConditionConfiguration
                .fn('dateNotProvided')
        );
    }

    switch (part) {
        case DateConditionOperation.YEAR:
            return date.getFullYear();
        case DateConditionOperation.MONTH:
            return date.getMonth() + 1;
        case DateConditionOperation.DAY:
            return date.getDate();
        case DateConditionOperation.HOUR:
            return date.getHours();
        case DateConditionOperation.MINUTE:
            return date.getMinutes();
        case DateConditionOperation.SECOND:
            return date.getSeconds();
        case DateConditionOperation.WEEK:
            const d = new Date(date.getTime());
            d.setHours(0, 0, 0, 0);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            const start = new Date(monday.getTime());
            const weekNum = Math.ceil((((date.getTime() - start.getTime()) / 86400000) + 1) / 7);
            return weekNum;
        default:
            return 0;
    }
}