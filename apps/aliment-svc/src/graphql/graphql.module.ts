import { dbConnection } from "../database/db-connection";
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from "@nestjs/common";
import { TacoService } from "../taco/taco.service";
import { AlimentResolver } from "./aliment.resolver";
import { HomeMeasureService } from "../home-measure/home-measure.service";
import { SecretAlimentService } from "../secret-aliment/secret-aliment.service";


@Module({
    imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            playground: true,
            path: '/graphql',
            context: ({ req }: any) => ({ req }),
        }),
        dbConnection(),
    ],
    providers: [AlimentResolver, TacoService, HomeMeasureService, SecretAlimentService],
    exports: [AlimentResolver],
})
export class GraphqlModule { }
