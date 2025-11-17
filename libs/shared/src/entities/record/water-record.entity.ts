import { Field, ID } from "@nestjs/graphql";
import { 
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn
} from "typeorm";

@Entity('water-records')
export class WaterRecord {
    @PrimaryGeneratedColumn('uuid')
    @Field(() => ID, { nullable: true })
    id: string;

    @CreateDateColumn()
    @Field({ nullable: true })
    createdAt: Date;

    @Column({ type: 'timestamp' })
    @Field()
    waterRelativeDate: Date;

    @Column()
    @Field()
    waterGoalId: string;

    @Column()
    @Field()
    patientId: string;

    @Column()
    @Field()
    nutritionistId: string;

    @Column()
    amountInMl: number;
}