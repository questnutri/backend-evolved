import { RepeatType } from "../../types"

export const errorMessagePattern = {
    auth: {
        emailAlreadyExists: {
            fn: () => 'An User with this email already exists'
        },
        invalidCredentials: {
            fn: () => `Invalid password or email not found`
        },
        userNotFoundWithEmail: {
            fn: (email?: string) => {
                if (email) return `User with email ${email} not found`;
                return `User not found`;
            }
        },
        userNotFoundWithId: {
            fn: (id: string) => `User with id ${id} not found`
        },
        tokenInvalidOrExpired: {
            fn: () => 'Invalid or expired token'
        },
        invalidPassword: {
            fn: () => `Invalid password`
        },
        didntReturnAValidId: {
            fn: () => 'Auth service did not return a valid user id'
        }
    },
    patient: {
        notFound: {
            fn: () => 'Patient not found or not related to nutritionist'
        },
        alreadyRegisteredWithNutritionist: {
            key: 'Patient is already registered'
        },
        patientNotFoundAfterFailedCreation: {
            key: 'Patient not found after failed creation attempt'
        },
        failedToUpdate: {
            fn: (error?: any) => {
                return 'Failed to update patient: ' + (error.details ?? 'unknown');
            }
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
            fn: () => 'Cannot change start date of an active or ended diet'
        },
        cannotChangeEndDateOfEndedDiet: {
            fn: () => 'Cannot change end date of an ended diet'
        },
        cannotSetDietEndDateBeforeStartDate: {
            fn: (details: {endDate: string, startDate: string}) => {
                return `Diet endDate (${details.endDate}) cannot be before startDate (${details.startDate}).`;
            }
        },
        cannotEndInSameDayAsStarted: {
            fn: (details: {endDate: string, startDate: string}) => {
                return `Diet end date (${details.endDate}) cannot be the same as start date (${details.startDate})`;
            }
        }
    },
    meal: {
        cannotAddToEndedDiet: {
            key: 'Cannot add meal to a diet that has ended'
        },
        notFound: {
            fn: () => 'Meal not found.'
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
        },
        cannotAddToEndedDietOrMeal: {
            fn: () => 'Cannot add food to a meal or diet that has ended'
        }
    },
    nutritionist: {
        notFound: {
            fn: () => `Nutritionist not found`
        },
        accountCreated: {
            fn: () => {
                return `Your account has been successfully created, but it is currently under review. Please wait for approval to access all features.`
            }
        },
        creationFailed: {
            fn: (error?: any) => {
                return 'Failed to create nutritionist: ' + (error?.detail ?? 'unknown');
            }
        },
        updateFailed: {
            fn: (error?: any) => {
                return 'Failed to update nutritionist: ' + (error?.detail ?? 'unknown');
            }
        },
        deleteFailed: {
            fn: (error?: any) => {
                return 'Failed to delete nutritionist: ' + (error?.detail ?? 'unknown');
            }
        },
        address: {
            notFound: {
                fn: () => 'Address not found'
            },
        }
    },
    admin: {
        isNotAdmin: {
            fn: () => "The user is not an admin."
        },
        nutritionistIsAlreadyActive: {
            fn: (email: string) => `Nutritionist with email ${email} is already active`
        }
    },
    record: {
        weight: {
            patientIdIsRequired: {
                fn: () => 'Nutritionist must send patient ID via body to create a weight record'
            }
        }
    },
    server: {
        didnotSendRightRequest: {
            fn: () => 'The service did not send a valid request'
        }
    },
    game: {
        listener: {
            notFound: {
                fn: () => 'Listener not found'
            },
            listenerHasTriggersAttached: {
                fn: () => 'Cannot delete listener with triggers attached'
            }
        },
        track: {
            invalidUpdateOperation: {
                fn: (details: {
                    operation: string,
                    type: string,
                    allowedOperations: string[]
                }
                ) => `Invalid update operation: '${details.operation}' for type: '${details.type}'. Allowed operations are: ${details.allowedOperations.join(', ')}`
            },
            templateNotFound: {
                fn: () => `Track template not found.`
            },
            trackRecordFailedToBeFoundAfterUpdate: {
                fn: () => `Track record failed to be found after update operation.`
            }
        },
        trigger: {
            triggerForListenerAndTrackAlreadyExists: {
                fn: (details: { trackId: string, listenerId: string }) => {
                    return `Trigger for (trackId: ${details.trackId}) and (listenerId: ${details.listenerId}) already exists.`
                }
            },
            invalidTriggerConditionConfiguration: {
                fn: (
                    type:
                        'foundAtNotProvided' |
                        'mappingKeyNotFound' |
                        'noConditionOperationDefinedNeitherDate' |
                        'dateNotProvided' |
                        'nonComparableValues',
                    details?: any
                ) => {
                    let message = '';
                    switch (type) {
                        case 'foundAtNotProvided':
                            message = `'foundAt' not provided in search specification`;
                            break;
                        case 'mappingKeyNotFound':
                            message = `The mapping key '${details.mappingKey}' was not found in the '${details.foundAt}' data.`;
                            break;
                        case 'noConditionOperationDefinedNeitherDate':
                            message = 'No condition operation defined neither date';
                            break;
                        case 'dateNotProvided':
                            message = 'Date value not provided in log data';
                            break;
                        case 'nonComparableValues':
                            message = 'Non-comparable values were defined for trigger';
                            break;
                    }

                    return `Invalid trigger condition configuration: ${message}`
                }
            },
            notFound: {
                fn: () => 'Trigger not found'
            }
        },
        achievement: {
            notFound: {
                fn: () => 'Achievement not found'
            }
        }
    }
}