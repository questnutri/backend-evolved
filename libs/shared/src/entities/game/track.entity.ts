import { PrimaryGeneratedColumn } from "typeorm";

export class TrackEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

}