import { Diet, Meal, Patient, WaterGoal } from "../../entities";
import { Payload_GetWaterGoalById } from "../../interfaces/proxy";
import { ProxyBodyCreatePatientDto } from "../../dto";

const pattern = <SEND = any, RECEIVE = any>(key: string) => {
    return {
        key,
        payload: {} as SEND,
        receive: {} as RECEIVE
    };
};

export const proxyPattern = {
    nutritionist: {
        getManyByIds: 'nutritionist.getManyByIds',
        getById: 'nutritionist.getById',
        getAll: 'nutritionist.getAll',
        softDeletionById: 'nutritionist.softDeletionById',
        approval: 'nutritionist.approval'
    },
    patient: {
        creation: pattern<ProxyBodyCreatePatientDto, Patient>('patient.creation'),
        getById: 'patient.getById', //data: { id: string }
        getManyByIds: 'patient.getManyByIds',
        getAll: pattern<{ nutritionistId?: string }, Patient[]>('patient.getAll'),
        softDeletionById: 'patient.softDeletionById',
        findAllFromNutritionist: 'patient.findAllFromNutritionist',//data: { nutritionistId: string }
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
        getAll: 'user.getAll',
        deletionById: 'user.deletionById',
        deletionByEmail: 'user.deletionByEmail',
        creation: 'user.creation'
    },
    admin: {
        login: 'admin.login'
    },
    diet: {
        getAll: 'diet.getAll',
        getOne: pattern<Partial<Diet>, Diet>('diet.getOne'),
        meal: {
            getOne: pattern<{ mealId: string, patientId?: string, nutritionistId?: string }, Meal>('diet.meal.getOne'),
        }
    }
}