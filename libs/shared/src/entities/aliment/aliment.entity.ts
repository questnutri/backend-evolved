import { AlimentSource } from "../../enums/aliment-source.enum";
import { ObjectId, ObjectIdColumn, Column } from "typeorm"  
export class Aliment {
    @ObjectIdColumn()
    _id: ObjectId;

    @Column()
    name: string;

    @Column()
    source: AlimentSource;

    @Column("text", { array: true })
    availablePortions: string[];

    @Column('json', { nullable: true })
    portions: { [key: string]: any };

}