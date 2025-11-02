export const proxyPattern = {
    nutritionist: {
        getManyByIds: 'nutritionist.getManyByIds',
        getById: 'nutritionist.getById',
        getAll: 'nutritionist.getAll',
        softDeletionById: 'nutritionist.softDeletionById',
        approval: 'nutritionist.approval'
    },
    patient: {
        creation: 'patient.creation',
        getById: 'patient.getById', //data: { id: string }
        getManyByIds: 'patient.getManyByIds',
        getAll: 'patient.getAll', //no data
        softDeletionById: 'patient.softDeletionById',
        findAllFromNutritionist: 'patient.findAllFromNutritionist',//data: { nutritionistId: string }
        isRelatedToNutritionist: 'patient.isRelatedToNutritionist'
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
    }
}