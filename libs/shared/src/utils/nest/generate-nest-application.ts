import { INestApplication } from "@nestjs/common"
import { NestApplicationBuilder } from "./nest-application-builder"

export const generateNestApplication = async (config: NestApplicationBuilder): Promise<INestApplication<any>> => {
    return await config.build();
}