import { IntersectionType } from "@nestjs/swagger";
import { Address } from "../../entities";
import { SearchDto } from "../search";

export class AddressFindOptions extends
    IntersectionType(
        SearchDto<Address>
    ) {
    notDeleted?: boolean
}