import { Entity } from "typeorm";
import { AlimentSource } from "../../enums/aliment-source.enum";
import { Aliment } from "./aliment.entity";
import { ObjectType } from '@nestjs/graphql';

@ObjectType({ implements: () => Aliment })
@Entity('home-measures')
export class HomeMeasureAliment extends Aliment {
    override source = AlimentSource.HOME_MEASURE;
}