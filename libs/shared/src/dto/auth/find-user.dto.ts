import { IntersectionType } from "@nestjs/swagger";
import { SearchDto } from "../search/search.dto";
import { User } from "../../entities";

export class FindUserOptions 
    extends IntersectionType(
        SearchDto<User>
    )
{}