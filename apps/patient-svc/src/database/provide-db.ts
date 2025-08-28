import { Patient, PatientNutritionist, provideTypeOrmDbConnection } from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    process.env.PATIENT_SERVICE_DATABASE_PORT || '5434',
    [Patient, PatientNutritionist],
)