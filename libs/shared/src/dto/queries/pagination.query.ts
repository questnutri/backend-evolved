import { IsOptional, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'

export class Pagination {
    page?: number
    limit?: number
}

export class PaginationQuery implements Pagination {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 20
}