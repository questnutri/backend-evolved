export const proxyPattern = {
    nutritionist: {
        getManyByIds: 'nutritionist.getManyByIds',
        getById: 'nutritionist.getById',
        getAll: 'nutritionist.getAll',
        softDeletionById: 'nutritionist.softDeletionById',
        approval: 'nutritionist.approval'
    },
    user: {
        getOneById: 'user.getOneById',
        getManyByIds: 'user.getManyByIds',
        getAll: 'user.getAll',
        deletionById: 'user.deletionById',
        deletionByEmail: 'user.deletionByEmail',
        creation: 'user.creation'
    },
    admin: {
        login: 'admin.login'
    }
}