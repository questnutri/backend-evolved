import { Exclude } from 'class-transformer'
import { UserRole } from '../../enums/user-roles.enum'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column({ unique: true })
    email!: string

    @Exclude()
    @Column()
    passwordHash!: string

    @Column({ type: "enum", enum: UserRole,default: UserRole.NUTRITIONIST })
    role!: UserRole

    @Column({ default: false })
    active?: boolean

    @CreateDateColumn()
    createdAt!: Date

    @UpdateDateColumn()
    updatedAt!: Date
}