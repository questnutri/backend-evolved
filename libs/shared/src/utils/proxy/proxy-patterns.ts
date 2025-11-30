import { Aliment, Diet, Meal, Nutritionist, Patient, User, WaterGoal, WeightRecord } from "../../entities";
import { Payload_GetWaterGoalById } from "../../interfaces/proxy";
import {
    ProxyBodyCreatePatientDto,
    DietIncludeOptions,
    PatientFindOptions,
    PaginationQuery,
    RegisterUserDto,
    NutritionistFindOptions,
    FindUserOptions,
} from "../../dto";
import { ContextUser } from "../context-user";
import { AlimentSource } from "../../enums";

const pattern = <SEND = any, RECEIVE = any>(key: string) => {
    return {
        key,
        payload: {} as SEND,
        response: {} as RECEIVE
    };
};

export const proxyPattern = {
    nutritionist: {
        getManyByIds: pattern<{ ids: string[], options?: NutritionistFindOptions & PaginationQuery }, Nutritionist[]>('nutritionist.getManyByIds'),
        getById: pattern<{ id: string }, Nutritionist>('nutritionist.getById'),
        getAll: 'nutritionist.getAll',
        softDeletionById: 'nutritionist.softDeletionById',
        approval: 'nutritionist.approval'
    },
    patient: {
        creation: pattern<ProxyBodyCreatePatientDto, Patient>('patient.creation'),
        getById: pattern<{ id: string, options?: PatientFindOptions, ctxUser: ContextUser }>('patient.getById'), //data: { id: string }
        getManyByIds: pattern<{ ids: string[], options?: PatientFindOptions & PaginationQuery }, Patient[]>('patient.getManyByIds'),
        getAll: pattern<{
            where: {
                nutritionistId?: string
            },
            ctxUser: ContextUser,
            options?: PatientFindOptions & PaginationQuery
        }, Patient[]>('patient.getAll'),
        softDeletionById: pattern<{ id: string }, boolean>('patient.softDeletionById'),
        findAllFromNutritionist: pattern<{ nutritionistId: string }, Patient[]>('patient.findAllFromNutritionist'),
        isRelatedToNutritionist: pattern<{ patientId: string, nutritionistId: string }, boolean>('patient.isRelatedToNutritionist'),
        water: {
            creation: 'patient.water.creation', //data: ProxyWaterGoalDto
            findCurrent: 'patient.water.findCurrent', //data: { patientId: string, nutritionistId: string, requestDate: Date }
            getById: pattern<Payload_GetWaterGoalById, WaterGoal>('patient.water.getById'),
        }
    },
    user: {
        getOneById: 'user.getOneById', //data: { id: string }
        getManyByIds: 'user.getManyByIds',
        getAll: pattern<FindUserOptions & PaginationQuery, User[]>('user.getAll'),
        deletionById: pattern<{ id: string }, { result: boolean }>('user.deletionById'),
        deletionByEmail: pattern<{ email: string }, { result: boolean }>('user.deletionByEmail'),
        creation: pattern<RegisterUserDto, User>('user.createOne')
    },
    admin: {
        login: 'admin.login'
    },
    diet: {
        getAll: pattern<{
            where: { nutritionistId?: string, patientId?: string },
            includes?: DietIncludeOptions
        }, Diet[]>('diet.getAll'),
        getOne: pattern<Partial<Diet>, Diet>('diet.getOne'),
        activate: pattern<{ id: string }, Diet>('diet.activate'),
        meal: {
            getOne: pattern<{ mealId: string, patientId?: string, nutritionistId?: string }, Meal>('diet.meal.getOne'),
        },
        deleteById: pattern<{ id: string }, { result: boolean }>('diet.deletionById')
    },
    record: {
        weight: {
            getLast: pattern<{
                patientId: string,
                ctxUser: ContextUser
            }, WeightRecord | null>('record.weight.getLast'),
        }
    },
    aliment: {
        getById: pattern<{ id: string }, Aliment>('aliment.getById'),
        getManyByIds: pattern<{ ids: string[], source: AlimentSource | null }, Aliment[]>('aliment.getManyByIds')
    },
    game: {
        message: pattern('game.message')
    },
    log: {
        message: pattern('log.message')
    },
    notification: {
        create: pattern<any, void>('notification.create')
    }
}