import { Patient, PatientNutritionist, provideTypeOrmDbConnection } from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    {
        port: process.env.DEV_PATIENT_SERVICE_DATABASE_PORT,
        host: process.env.DEV_PATIENT_SERVICE_DATABASE_HOST || 'patient-postgres-service',
        entities: [Patient, PatientNutritionist],
    }
)