import { Entity } from "typeorm";
import { AlimentSource } from "../../enums/aliment-source.enum";
import { Aliment } from "./aliment.entity";
import { ObjectType } from '@nestjs/graphql';

@ObjectType({ implements: () => Aliment })
@Entity('secret_aliment')
export class SecretAliment extends Aliment {
    override source = AlimentSource.SECRET;
}