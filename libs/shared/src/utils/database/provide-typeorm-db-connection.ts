import { TypeOrmModule } from '@nestjs/typeorm';

export const provideTypeOrmDbConnection = (databasePort: string, entities: any[]) => {
    return {
        ...TypeOrmModule.forRootAsync({
            useFactory: () => ({
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(databasePort),
                username: process.env.DB_USER || 'root',
                password: process.env.DB_PASS || 'root',
                database: process.env.DB_NAME || 'userdb',
                autoLoadEntities: true,
                entities,
                synchronize: true
            }),
        }),
        ...TypeOrmModule.forFeature(entities)
    }

}