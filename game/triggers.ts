export const dietCountTriggers = [
    {
        "trackId": "{{track_id}}",
        "listenerId": "{{listener_id}}",
        "conditions": [
            {
                "foundAt": "statusCode",
                "propertyType": "number",
                "conditionOperation": "EQUAL",
                "value": "201"
            },
            {
                "foundAt": "user",
                "mappedBy": "role",
                "propertyType": "string",
                "conditionOperation": "EQUAL",
                "value": "patient"
            },
            {
                "foundAt": "data",
                "mappedBy": "createdAt",
                "propertyType": "date",
                "conditionOperation": "EQUAL",
                "compare": {
                    "foundAt": "data",
                    "mappedBy": "updatedAt"
                }
            }
        ]
    }
];

export const dietTrackTriggers = [
    {
        "trackId": "{{track_id}}",
        "listenerId": "{{listener_id}}",
        "conditions": [
            {
                "foundAt": "statusCode",
                "propertyType": "number",
                "conditionOperation": "EQUAL",
                "value": "201"
            },
            {
                "foundAt": "user",
                "mappedBy": "role",
                "propertyType": "string",
                "conditionOperation": "EQUAL",
                "value": "patient"
            },
            {
                "foundAt": "data",
                "mappedBy": "totalMealsForDay",
                "propertyType": "number",
                "conditionOperation": "GREATER_OR_EQUAL",
                "compare": {
                    "foundAt": "data",
                    "mappedBy": "completedMealsForDay"
                }
            },
            {
                "foundAt": "timestamp",
                "propertyType": "date",
                "conditionOperation": "GREATER_THAN",
                "applyOperationOnDate": "day",
                "compare": {
                    "foundAt": "trackRecord",
                    "mappedBy": "lastUpdatedAt"
                }
            }
        ]
    }
];

export const weightTriggers = [
    {
        "trackId": "{{track_id}}",
        "listenerId": "{{listener_id}}",
        "conditions": [
            {
                "foundAt": "statusCode",
                "propertyType": "number",
                "conditionOperation": "EQUAL",
                "value": "201"
            },
            {
                "foundAt": "user",
                "mappedBy": "role",
                "propertyType": "string",
                "conditionOperation": "EQUAL",
                "value": "patient"
            }
        ]
    }
];

export const waterTriggers = [
    {
        "trackId": "{{track_id}}",
        "listenerId": "{{listener_id}}",
        "conditions": [
            {
                "foundAt": "statusCode",
                "propertyType": "number",
                "conditionOperation": "EQUAL",
                "value": "201"
            },
            {
                "foundAt": "user",
                "mappedBy": "role",
                "propertyType": "string",
                "conditionOperation": "EQUAL",
                "value": "patient"
            },
            {
                "foundAt": "data",
                "mappedBy": "totalIntake",
                "propertyType": "number",
                "conditionOperation": "GREATER_OR_EQUAL",
                "compare": {
                    "foundAt": "data",
                    "mappedBy": "currentDailyWaterGoal"
                }
            },
            {
                "foundAt": "timestamp",
                "propertyType": "date",
                "conditionOperation": "GREATER_THAN",
                "applyOperationOnDate": "day",
                "compare": {
                    "foundAt": "trackRecord",
                    "mappedBy": "lastUpdatedAt"
                }
            }
        ]
    }
];

export const loginTriggers = [
    {
        "trackId": "{{track_id}}",
        "listenerId": "{{listener_id}}",
        "conditions": [
            {
                "foundAt": "statusCode",
                "propertyType": "number",
                "conditionOperation": "EQUAL",
                "value": "200"
            },
            {
                "foundAt": "user",
                "mappedBy": "role",
                "propertyType": "string",
                "conditionOperation": "EQUAL",
                "value": "patient"
            },
            {
                "foundAt": "timestamp",
                "propertyType": "date",
                "conditionOperation": "GREATER_THAN",
                "applyOperationOnDate": "day",
                "compare": {
                    "foundAt": "trackRecord",
                    "mappedBy": "lastUpdatedAt"
                }
            }
        ]
    }
];