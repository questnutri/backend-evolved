import { Admin, provideTypeOrmDbConnection, AdminManagementLevel, PatientManagementLevel, NutritionistManagementLevel, DietManagementLevel, GameManagementLevel, LogManagementLevel, RecordManagementLevel } from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    process.env.DEV_ADMIN_SERVICE_DATABASE_PORT || '5432',
    process.env.DEV_ADMIN_SERVICE_DATABASE_HOST || 'admin-postgres-service',
    [
        Admin,
        AdminManagementLevel,
        NutritionistManagementLevel,
        PatientManagementLevel,
        RecordManagementLevel,
        DietManagementLevel,
        GameManagementLevel,
        LogManagementLevel
    ],
    false
)