import { RepeatType } from "../../types"

export const errorMessagePattern = {
    patient: {
        notFound: {
            key: ''
        }
    },
    diet: {
        notFound: {
            key: 'Diet not found or not related to user'
        },
        cannotDeleteEndedDiet: {
            key: 'This diet already ended'
        },
        cannotChangeStartDateOfActiveOrEndedDiet: {
            key: 'Cannot change start date of an active or ended diet'
        },
    },
    meal: {
        cannotAddToEndedDiet: {
            key: 'Cannot add meal to a diet that has ended'
        },
        notFound: {
            key: 'Meal not found or user does not have access to this meal.'
        },
        startDateCannotBeInPast: {
            /** `Meal start date cannot be in the past of current request date: ${requestDate}.` */
            fn: (requestDate: string) => {
                return `Meal start date cannot be in the past of current request date: ${requestDate}.`
            }
        },
        startDateAfterDietEndDate: {
            /** `Meal start date ${mealStartDate} cannot be after diet end date ${dietEndDate}` */
            fn: (mealStartDate: string, dietEndDate: string) => {
                return `Meal start date ${mealStartDate} cannot be after diet end date ${dietEndDate}`
            }
        },
        startDateBeforeDietStartDate: {
            /** `Meal start date ${mealStartDate} cannot be before diet start date ${dietStartDate}` */
            fn: (mealStartDate: string, dietStartDate: string) => {
                return `Meal start date ${mealStartDate} cannot be before diet start date ${dietStartDate}`
            }
        },
        endDateAfterDietEndDate: {
            /** `Meal end date ${mealEndDate} cannot be after diet end date ${dietEndDate}`*/
            fn: (mealEndDate: string, dietEndDate: string) => {
                return `Meal end date ${mealEndDate} cannot be after diet end date ${dietEndDate}`
            }
        },
        endDateBeforeMealStartDate: {
            /** `Meal end date ${mealEndDate} cannot be before meal start date ${mealStartDate}` */
            fn: (mealEndDate: string, mealStartDate: string) => {
                return `Meal end date ${mealEndDate} cannot be before meal start date ${mealStartDate}`
            }
        },
        targetDateBeforeDietStartDate: {
            /** `Target date cannot be in the past compared to diet start date of: ${validStartTargetDate}` */
            fn: (validStartTargetDate: string) => {
                return `Target date cannot be in the past compared to diet start date of: ${validStartTargetDate}`
            }
        },
        targetDateAfterDietEndDate: {
            /** `Target date cannot be after diet end date of: ${validEndTargetDate}` */
            fn: (validEndTargetDate: string) => {
                return `Target date cannot be after diet end date of: ${validEndTargetDate}`
            }
        },
        invalidRepeatConfiguration: {
            /** `Invalid repeat configuration type for '${type}' use only: ${allowedTypes}` */
            fn: (type: RepeatType) => {
                return `Invalid repeat configuration type for '${type}' use only: ${Object.values(RepeatType).join(', ')}`
            },
        }
    },
    food: {
        notFound: {
            key: 'Food not found or user does not have access to this food.'
        }
    }
} 