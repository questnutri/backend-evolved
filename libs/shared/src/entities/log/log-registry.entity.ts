import { Entity } from "typeorm";

@Entity('logs')
export class LogRegistry {
    timestamp: Date
    microservice: string
}