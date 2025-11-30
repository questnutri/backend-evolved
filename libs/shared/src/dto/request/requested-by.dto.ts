import { UserRole } from "../../enums";
import { ContextUser } from "../../utils";

export class RequestedBy implements ContextUser {
    id: string;
    role: UserRole
}