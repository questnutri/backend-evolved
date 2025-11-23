import { applyDecorators } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";

export function GenerateApiPaginationQuery() {
    return applyDecorators(
        ApiQuery({
            description: 'Page number for pagination',
            name: 'page',
            required: false,
            type: Number,
        }),
        ApiQuery({
            description: 'Number of items per page',
            name: 'limit',
            required: false,
            type: Number,
        })
    );
}