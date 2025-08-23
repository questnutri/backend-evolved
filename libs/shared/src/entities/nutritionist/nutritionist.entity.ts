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
        unique: true,
    })
    phone: string;

    @Column({
        unique: true,
    })
    crn: string;

    @Column({
        type: 'enum',
        enum: DocumentType,
        default: DocumentType.CPF,
    })
    documentType: DocumentType;

    @Column({
        unique: true,
    })
    documentNumber: string;
}
