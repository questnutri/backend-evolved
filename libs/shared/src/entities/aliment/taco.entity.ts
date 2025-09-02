import { Entity } from "typeorm";
import { AlimentSource } from "../../enums/aliment-source.enum";
import { Aliment } from "./aliment.entity";

@Entity('taco')
export class TacoAliment extends Aliment {
    override source = AlimentSource.TACO;
}