import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { 
    UpdateOperation,
    PropertyType,
    TrackType,
    type TrackConfiguration
} from '../../../entities';

export class CreateTrackDto {
    @ApiProperty({
        example: 'Experience Points',
        description: 'The name of the track template'
    })
    @IsNotEmpty()
    @IsString()
    name: string;


    @ApiPropertyOptional({
        example: 'Tracks the experience points earned by the user',
        description: 'A brief description of the track template'
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        example: {
            type: TrackType.COUNTER,
            initialValue: 0,
            updateOperation: UpdateOperation.ADD,
            trackPropertyType: PropertyType.NUMBER
        },
        description: 'The configuration settings for the track'
    })
    @IsNotEmpty()
    configuration: TrackConfiguration
}