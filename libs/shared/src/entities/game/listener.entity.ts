import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EventOrigin } from "../../enums";
import { ApiProperty } from "@nestjs/swagger";

@Entity('listeners')
export class ListenerEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: EventOrigin,
    })
    @ApiProperty({ example: EventOrigin.CONTROLLER, enum: EventOrigin })
    origin: EventOrigin;

    @Column()
    controller: string;

    @Column()
    method: string;

    @Column()
    path: string;

}