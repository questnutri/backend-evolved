import { RepeatType } from "../../types"

export const errorMessagePattern = {
    diet: {
        notFound: {
            key: 'Diet not found or user does not have access to this diet.'
        },
        meal: {
            notFound: {
                key: 'Meal not found or user does not have access to this meal.'
            },
            startDateAfterDietEndDate: {
                fn: (mealStartDate: string, dietEndDate: string) => {
                    return `Meal start date ${mealStartDate} cannot be after diet end date ${dietEndDate}`
                }
            },
            startDateBeforeDietStartDate: {
                fn: (mealStartDate: string, dietStartDate: string) => {
                    return `Meal start date ${mealStartDate} cannot be before diet start date ${dietStartDate}`
                }
            },
            endDateAfterDietEndDate: {
                fn: (mealEndDate: string, dietEndDate: string) => {
                    return `Meal end date ${mealEndDate} cannot be after diet end date ${dietEndDate}`
                }
            },
            endDateBeforeMealStartDate: {
                fn: (mealEndDate: string, mealStartDate: string) => {
                    return `Meal end date ${mealEndDate} cannot be before meal start date ${mealStartDate}`
                }
            },
            targetDateBeforeDietStartDate: {
                fn: (validStartTargetDate: string) => {
                    return `Target date cannot be in the past compared to diet start date of: ${validStartTargetDate}`
                }
            },
            targetDateAfterDietEndDate: {
                fn: (validEndTargetDate: string) => {
                    return `Target date cannot be after diet end date of: ${validEndTargetDate}`
                }
            },
            invalidRepeatConfiguration: {
                fn: (type: RepeatType) => {
                    `Invalid repeat configuration type for '${type}' use only: ${Object.values(RepeatType).join(', ')}`
                },
            }
        },
        food: {
            notFound: {
                key: 'Food not found or user does not have access to this food.'
            }
        }
    }
} 