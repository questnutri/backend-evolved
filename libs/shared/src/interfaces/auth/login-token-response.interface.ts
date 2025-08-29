import { UserRole } from "../../enums";

export interface LoginTokenResponse {
    accessToken: string;
    refreshToken: string;
    role: UserRole
}