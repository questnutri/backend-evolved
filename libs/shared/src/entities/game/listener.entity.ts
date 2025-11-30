import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { EventOrigin } from "../../enums";
import { ApiProperty } from "@nestjs/swagger";
import { Trigger } from "./trigger/trigger.entity";

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
    handler: string;

    @OneToMany(() => Trigger, (trigger) => trigger.listener)
    triggers: Trigger[];
}