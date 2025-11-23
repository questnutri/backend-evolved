import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Nutritionist } from './nutritionist.entity';

@Entity('addresses')
export class Address {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({
        description: 'Unique identifier for the address',
        example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6'
    })
    id: string;

    @ApiProperty({
        description: 'Custom name for the addresss',
        example: 'Home',
    })
    @Column({
        type: 'varchar',
        length: 100,
        nullable: true
    })
    name: string | null;

    @Column({
        type: 'varchar',
        length: 255,
    })
    @ApiProperty({
        description: 'Street name',
        example: 'Rua das Flores'
    })
    street: string;

    @Column({
        type: 'varchar',
        length: 20
    })
    @ApiProperty({
        description: 'Street number',
        example: '123'
    })
    number: string;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: true
    })
    @ApiProperty({
        description: 'Complement',
        example: 'Apt 45',
        required: false
    })
    complement?: string;

    @Column({
        type: 'varchar',
        length: 100
    })
    @ApiProperty({
        description: 'Neighborhood',
        example: 'Centro'
    })
    neighborhood: string;

    @Column({
        type: 'varchar',
        length: 100
    })
    @ApiProperty({
        description: 'City',
        example: 'São Paulo'
    })
    city: string;

    @Column({
        type: 'varchar',
        length: 2
    })
    @ApiProperty({
        description: 'State abbreviation',
        example: 'SP'
    })
    state: string;

    @Column({
        type: 'varchar',
        length: 10
    })
    @ApiProperty({
        description: 'ZIP code',
        example: '01234-567'
    })
    zipCode: string;

    @ApiProperty({
        description: 'Country',
        example: 'Brazil'
    })
    @Column({
        type: 'varchar',
        length: 100,
        default: 'Brazil'
    })
    country: string = 'Brazil';

    @Column({ name: 'nutritionistId', nullable: true })
    nutritionistId: string;

    @ManyToOne(() => Nutritionist, nutritionist => nutritionist.addresses, { onDelete: 'CASCADE' })
    @ApiProperty({
        description: 'The nutritionist associated with this address'
    })
    @JoinColumn({ name: 'nutritionistId' })
    nutritionist: Nutritionist;

    @CreateDateColumn()
    createdAt!: Date

    @UpdateDateColumn()
    updatedAt!: Date

    @DeleteDateColumn()
    deletedAt?: Date | null;
}