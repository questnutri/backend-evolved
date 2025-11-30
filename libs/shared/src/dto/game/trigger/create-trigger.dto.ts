import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";
import { TriggerCondition } from "../../../entities";

export class CreateTriggerDto {
    @ApiProperty({
        example: 'listener-uuid-1234',
        description: 'The unique identifier of the listener that this trigger is associated with',
        required: true
    })
    @IsNotEmpty()
    @IsUUID()
    listenerId: string;

    @ApiProperty({
        example: 'track-uuid-5678',
        description: 'The unique identifier of the track that this trigger is associated with',
        required: true
    })
    @IsNotEmpty()
    @IsUUID()
    trackId: string;

    @ApiProperty({})
    conditions: TriggerCondition[]
}