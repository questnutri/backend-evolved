import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseType } from 'typeorm';

export const provideTypeOrmDbConnection = (databasePort: string, entities: any[], synchronize: boolean = true, driver: DatabaseType = 'postgres') => {
    return {
        ...TypeOrmModule.forRootAsync({
            useFactory: () => ({
                type: driver as any,
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(databasePort),
                username: process.env.DB_USER || 'root',
                password: process.env.DB_PASS || 'root',
                database: process.env.DB_NAME || 'userdb',
                authSource: driver === 'mongodb' ? 'admin' : undefined,
                autoLoadEntities: true,
                entities,
                synchronize: true
            }),
        }),
        ...TypeOrmModule.forFeature(entities)
    }

}