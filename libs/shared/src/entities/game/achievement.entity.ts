import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('achievements')
export class AchievementEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'varchar', nullable: true })
    description?: string;

    @Column()
    trackId: string;

    @Column()
    targetValue: string;

    @Column({ type: 'varchar', nullable: true })
    dependentAchievementId: string;
}