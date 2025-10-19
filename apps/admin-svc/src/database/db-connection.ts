import { Admin, provideTypeOrmDbConnection, AdminManagementLevel, PatientManagementLevel, NutritionistManagementLevel, DietManagementLevel, GameManagementLevel, LogManagementLevel, RecordManagementLevel } from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    {
        host: process.env.DEV_ADMIN_SERVICE_DATABASE_HOST || 'admin-postgres-service',
        port: process.env.DEV_ADMIN_SERVICE_DATABASE_PORT,
        entities: [
            Admin,
            AdminManagementLevel,
            NutritionistManagementLevel,
            PatientManagementLevel,
            RecordManagementLevel,
            DietManagementLevel,
            GameManagementLevel,
            LogManagementLevel
        ],
        synchronize: false
    }
)