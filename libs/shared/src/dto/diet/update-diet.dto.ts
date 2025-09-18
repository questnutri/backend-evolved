import { InputType } from "@nestjs/graphql";
import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateDietDto } from "./create-diet.dto";

@InputType()
export class UpdateDietDto extends PartialType(OmitType(CreateDietDto, ['patientId', 'dayInterpretationMode'] as const)) {
}
