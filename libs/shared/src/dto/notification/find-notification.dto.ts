import { IntersectionType } from "@nestjs/swagger";
import { SearchDto } from "../search";
import { NotificationEntity } from "src/entities";

export class NotificationFindOptions extends IntersectionType(
    SearchDto<NotificationEntity>,
) {}