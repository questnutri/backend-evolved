import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseType } from 'typeorm';

export const provideTypeOrmDbConnection = (
    config: {
        port?: string, 
        host: string, 
        entities: any[], 
        synchronize?: boolean
        driver?: DatabaseType
    }
) => {
    const defaultValues = { 
        port: '5432', 
        host: 'localhost', 
        entities: [], 
        synchronize: true, 
        driver: 'postgres'
    }
    return {
        ...TypeOrmModule.forRootAsync({
            useFactory: () => ({
                type: config.driver as any || defaultValues.driver,
                host: config.host || defaultValues.host,
                port: parseInt(config.port || defaultValues.port),
                username: process.env.DB_USER || 'root',
                password: process.env.DB_PASS || 'root',
                database: process.env.DB_NAME || 'questnutri',
                authSource: (config.driver || defaultValues.driver) === 'mongodb' ? 'admin' : undefined,
                autoLoadEntities: true,
                entities: config.entities || defaultValues.entities,
                synchronize: config.synchronize ?? defaultValues.synchronize
            }),
        }),
        ...TypeOrmModule.forFeature(config.entities || defaultValues.entities)
    }

}