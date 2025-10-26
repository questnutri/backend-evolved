import { Column, Entity, PrimaryColumn } from 'typeorm';
import { DocumentType } from '../../enums/document-type.enum';

@Entity('nutritionists')
export class Nutritionist {
    @PrimaryColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column({
        type: 'varchar',
        unique: true,
        nullable: true
    })
    phone: string | null;

    @Column({
        type: 'varchar',
        unique: true,
        nullable: true
    })
    crn: string | null;

    @Column({
        type: 'enum',
        enum: DocumentType,
        default: DocumentType.CPF,
    })
    documentType: DocumentType;
    
    @Column({
        type: 'varchar',
        unique: true,
        nullable: true
    })
    documentNumber: string | null;
}