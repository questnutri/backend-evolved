import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { EventOrigin } from "../../enums";
import { ApiProperty } from "@nestjs/swagger";
import { TriggerEntity } from "./trigger.entity";

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

    @OneToMany(() => TriggerEntity, (trigger) => trigger.listener)
    triggers: TriggerEntity[];
}