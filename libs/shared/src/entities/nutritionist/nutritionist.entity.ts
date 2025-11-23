import { Column, Entity, PrimaryColumn } from 'typeorm';
import { DocumentType } from '../../enums/document-type.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('nutritionists')
export class Nutritionist {
    @PrimaryColumn('uuid')
    @ApiProperty({ example: 'f4f26736-5ad9-4dc2-9392-633b3fac1a4c' })
    id: string;

    @Column()
    @ApiProperty({ example: 'John' })
    firstName: string;

    @Column()
    @ApiProperty({ example: 'Doe' })
    lastName: string;

    @Column()
    @ApiProperty({ example: 'john.doe@example.com' })
    email: string;

    @Column({
        type: 'varchar',
        unique: true,
        nullable: true
    })
    @ApiProperty({ example: '+55 (11) 99999-9888', nullable: true })
    phone: string | null;

    @Column({
        type: 'varchar',
        unique: true,
        nullable: true
    })
    @ApiProperty({ example: 'CRN-01 1234', nullable: true })
    crn: string | null;

    @Column({
        type: 'enum',
        enum: DocumentType,
        default: DocumentType.CPF,
    })
    @ApiProperty({ example: DocumentType.CPF, enum: DocumentType })
    documentType: DocumentType;
    
    @Column({
        type: 'varchar',
        unique: true,
        nullable: true
    })
    @ApiProperty({ example: '123.456.789-00', nullable: true })
    documentNumber: string | null;
}