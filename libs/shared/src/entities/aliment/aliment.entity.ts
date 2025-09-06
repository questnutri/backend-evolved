import { AlimentSource } from "../../enums/aliment-source.enum";
import { ObjectId, ObjectIdColumn, Column } from "typeorm";
import { InterfaceType, Field, ID } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@InterfaceType()
export class Aliment {
    @Field(() => ID)
    @ObjectIdColumn()
    _id: ObjectId;

    @Field()
    @Column()
    name: string;

    @Field(() => String)
    @Column()
    source: AlimentSource;

    @Field(() => [String])
    @Column("text", { array: true })
    availablePortions: string[];

    @Field(() => GraphQLJSON, { nullable: true })
    @Column('json', { nullable: true })
    portions: { [key: string]: any };
}