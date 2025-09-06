import { Entity } from "typeorm";
import { AlimentSource } from "../../enums/aliment-source.enum";
import { Aliment } from "./aliment.entity";
import { ObjectType } from '@nestjs/graphql';

@ObjectType({ implements: () => Aliment })
@Entity('taco')
export class TacoAliment extends Aliment {
    override source = AlimentSource.TACO;
}