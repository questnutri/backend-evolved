import { applyDecorators } from "@nestjs/common";
import {
    ApiBadRequestResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";

export function GenerateAccessResponse() {
    return applyDecorators(
        ApiUnauthorizedResponse({
            description: "Unauthorized access",
            examples: {
                missingHeader: {
                    summary: "Missing or invalid authorization header",
                    value: {
                        statusCode: 401,
                        message: "Missing or invalid authorization header",
                        error: "Unauthorized"
                    }
                },
                jwtExpired: {
                    summary: "JWT expired",
                    value: {
                        statusCode: 401,
                        message: "JWT expired",
                        error: "Unauthorized"
                    }
                }
            }
        }),
        ApiForbiddenResponse({
            description: "Forbidden access",
            example: {
                statusCode: 403,
                message: "You do not have permission to access this resource",
                error: "Forbidden"
            }
        }),
        ApiInternalServerErrorResponse({
            description: "Internal server error",
            examples: {
                jwksError: {
                    summary: "Error fetching JWKS (Auth service might be down)",
                    value: {
                        statusCode: 500,
                        message: "Error fetching JWKS",
                        error: "Internal Server Error"
                    }
                }
            }
        })
    );
}

export function GenerateBadRequestResponse(options: GenerateBadRequestOptions) {
    const dtoRequests = options.dto ? getValidationMessagesFromDto(options.dto) : {};
    const combinedRequests = Object.assign({}, dtoRequests, options.requests ?? {});
    const includeInvalidKeyword = options.includeInvalidKeyword ?? { onDto: true, onRequests: true };

    const examples = [];
    for (const [name, value] of Object.entries(combinedRequests)) {
        const last = name.includes(".") ? name.split(".").pop() || name : name;
        const underscored = last.replaceAll("_", " ");
        const spaced = underscored.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
        let formattedName = spaced.toLocaleLowerCase();

        const fromDto = dtoRequests[name] !== undefined;
        const shouldInclude = fromDto ? includeInvalidKeyword.onDto : includeInvalidKeyword.onRequests;

        if (!shouldInclude && formattedName.length > 0) {
            formattedName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
        }

        examples.push({
            [name]: {
                summary: `${shouldInclude ? "Invalid " : ""}${formattedName}`,
                value: {
                    message: value,
                    error: "Bad Request",
                    statusCode: 400
                }
            }
        });
    }

    return applyDecorators(
        ApiBadRequestResponse({
            description: options.description,
            examples: Object.assign({}, ...examples)
        })
    );
}

function getValidationMessagesFromDto(dtoType: any): { [key: string]: string[] } {
    try {
        const { validateSync } = require("class-validator");
        const instance = new dtoType();
        const errors = validateSync(instance, {
            skipMissingProperties: false,
            whitelist: false,
            forbidUnknownValues: false
        });

        const requests: { [key: string]: string[] } = {};

        function handleError(err: any, prefix = "") {
            const key = prefix ? `${prefix}.${err.property}` : err.property;
            if (err.constraints) requests[key] = Object.values(err.constraints);
            if (err.children && err.children.length) {
                err.children.forEach((child: any) => handleError(child, key));
            }
        }

        for (const err of errors) handleError(err);
        return requests;
    } catch {
        return {};
    }
}

export interface GenerateBadRequestOptions {
    description: string;
    requests?: { [key: string]: any };
    dto?: any;
    includeInvalidKeyword?: {
        onDto?: boolean;
        onRequests?: boolean;
    };
}
