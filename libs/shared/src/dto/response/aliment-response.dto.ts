import { Field, ObjectType } from "@nestjs/graphql";
import { Aliment, PageResponse } from "@backend-evolved/shared";

@ObjectType()
export class AlimentResponse implements PageResponse<Aliment> {
    @Field()
    currentPage: number;

    @Field()
    length: number;

    @Field()
    isFirstPage: boolean;

    @Field()
    isLastPage: boolean;

    @Field()
    totalPages: number;

    @Field()
    totalItems: number;

    @Field(() => [Aliment])
    items: Aliment[];

}