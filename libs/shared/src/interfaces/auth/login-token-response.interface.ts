import { UserRole } from "../../enums";
import { AuthenticationTokens } from "./authentication-tokens.interface";

export interface LoginResponse extends AuthenticationTokens {
    role: UserRole
    id: string
}