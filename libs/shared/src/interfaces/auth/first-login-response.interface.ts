import { ResetPasswordResponse } from "./reset-token-response.interface";

export interface FirstLoginResponse extends ResetPasswordResponse {
    firstLogin: true;
}