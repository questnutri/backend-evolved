import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('addresses')
export class Address {
    //TODO: Add relation to Nutritionist entity
    //TODO: Implement soft delete
    //TODO: Create Controller and Service for Address entity

    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ description: 'Unique identifier for the address' })
    id: string;

    @Column({ type: 'varchar', length: 255 })
    @ApiProperty({ description: 'Street name', example: 'Rua das Flores' })
    street: string;

    @Column({ type: 'varchar', length: 20 })
    @ApiProperty({ description: 'Street number', example: '123' })
    number: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    @ApiProperty({ description: 'Complement', example: 'Apt 45', required: false })
    complement?: string;

    @Column({ type: 'varchar', length: 100 })
    @ApiProperty({ description: 'Neighborhood', example: 'Centro' })
    neighborhood: string;

    @Column({ type: 'varchar', length: 100 })
    @ApiProperty({ description: 'City', example: 'São Paulo' })
    city: string;

    @Column({ type: 'varchar', length: 2 })
    @ApiProperty({ description: 'State abbreviation', example: 'SP' })
    state: string;

    @Column({ type: 'varchar', length: 10 })
    @ApiProperty({ description: 'ZIP code', example: '01234-567' })
    zipCode: string;
}