import { 
    AdminManagementLevel,
    DietManagementLevel,
    GameManagementLevel,
    LogManagementLevel,
    NutritionistManagementLevel,
    PatientManagementLevel,
    RecordManagementLevel
} from "../entities";

export const AvailableGrantEntities: any = {
    admin: AdminManagementLevel,
    nutritionist: NutritionistManagementLevel,
    patient: PatientManagementLevel,
    diet: DietManagementLevel,
    record: RecordManagementLevel,
    game: GameManagementLevel,
    log: LogManagementLevel
} as const