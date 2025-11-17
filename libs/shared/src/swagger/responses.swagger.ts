import { applyDecorators } from "@nestjs/common";
import {
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";

export function ApiAccessResponses() {
    return applyDecorators(
        ApiUnauthorizedResponse({
            description: "Unauthorized access",
            examples: {
                missingHeader: {
                    summary: "Missing or invalid authorization header",
                    value: {
                        statusCode: 401,
                        message: "Missing or invalid authorization header",
                        error: "Unauthorized",
                    },
                },
                jwtExpired: {
                    summary: "JWT expired",
                    value: {
                        statusCode: 401,
                        message: "JWT expired",
                        error: "Unauthorized",
                    },
                },
            },
        }),
        ApiForbiddenResponse({
            description: "Forbidden access",
            example: {
                statusCode: 403,
                message: "You do not have permission to access this resource",
                error: "Forbidden",
            },
        }),
        ApiInternalServerErrorResponse({
            description: "Internal server error",
            examples: {
                jwksError: {
                    summary: "Error fetching JWKS (Auth service might be down)",
                    value: {
                        statusCode: 500,
                        message: "Error fetching JWKS",
                        error: "Internal Server Error",
                    },
                },
            },
        }),
    );
}