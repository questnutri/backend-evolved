import { IntersectionType } from "@nestjs/swagger";
import { SearchDto } from "../../search";
import { ListenerEntity } from "../../../entities";

export class ListenerIncludeOptions {
    includeTriggers?: boolean;
}

export class ListenerFindOptions extends IntersectionType(
    SearchDto<ListenerEntity>,
    ListenerIncludeOptions
) {}