import { Patient, PatientNutritionist, provideTypeOrmDbConnection } from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    process.env.DEV_PATIENT_SERVICE_DATABASE_PORT || '5432',
    process.env.DEV_PATIENT_SERVICE_DATABASE_HOST || 'patient-postgres-service',
    [Patient, PatientNutritionist],
)