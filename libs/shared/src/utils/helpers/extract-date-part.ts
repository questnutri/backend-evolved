import { InternalServerErrorException } from "@nestjs/common"
import { errorMessagePattern } from "../../patterns"
import { DateConditionOperation } from "../../entities"

export function extractDatePart(date: Date, part: DateConditionOperation): number {
    if (!date) {
        throw new InternalServerErrorException(
            errorMessagePattern
                .game
                .trigger
                .invalidTriggerConditionConfiguration
                .fn('dateNotProvided')
        )
    }
    switch (part) {
        case DateConditionOperation.YEAR:
            return date.getFullYear()
        case DateConditionOperation.MONTH:
            return date.getMonth() + 1
        case DateConditionOperation.DAY:
            return date.getDate()
        case DateConditionOperation.HOUR:
            return date.getHours()
        case DateConditionOperation.MINUTE:
            return date.getMinutes()
        case DateConditionOperation.SECOND:
            return date.getSeconds()
        case DateConditionOperation.WEEK:
            const d = new Date(date.getTime())
            d.setHours(0, 0, 0, 0)
            const day = d.getDay()
            const diff = d.getDate() - day + (day === 0 ? -6 : 1)
            const monday = new Date(d.setDate(diff))
            const start = new Date(monday.getTime())
            const weekNum = Math.ceil((((date.getTime() - start.getTime()) / 86400000) + 1) / 7)
            return weekNum
        default:
            return 0
    }
}

export function truncateDateToPart(date: Date, part: DateConditionOperation): Date {
    if (!date) {
        throw new InternalServerErrorException(
            errorMessagePattern
                .game
                .trigger
                .invalidTriggerConditionConfiguration
                .fn('dateNotProvided')
        )
    }
    const d = new Date(date.getTime())
    switch (part) {
        case DateConditionOperation.YEAR:
            d.setMonth(0, 1)
            d.setHours(0, 0, 0, 0)
            return d
        case DateConditionOperation.MONTH:
            d.setDate(1)
            d.setHours(0, 0, 0, 0)
            return d
        case DateConditionOperation.DAY:
            d.setHours(0, 0, 0, 0)
            return d
        case DateConditionOperation.HOUR:
            d.setMinutes(0, 0, 0)
            return d
        case DateConditionOperation.MINUTE:
            d.setSeconds(0, 0, 0)
            return d
        case DateConditionOperation.SECOND:
            d.setMilliseconds(0)
            return d
        case DateConditionOperation.WEEK:
            const copy = new Date(d.getTime())
            copy.setHours(0, 0, 0, 0)
            const day = copy.getDay()
            const diff = copy.getDate() - day + (day === 0 ? -6 : 1)
            const monday = new Date(copy.setDate(diff))
            monday.setHours(0, 0, 0, 0)
            return monday
        default:
            return d
    }
}
