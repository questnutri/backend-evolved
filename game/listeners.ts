export const loginListeners = [
    {
        "origin": "CONTROLLER",
        "controller": "AuthRestController",
        "method": "POST",
        "handler": "login"
    }
    ,
    {
        "origin": "CONTROLLER",
        "controller": "AuthRestController",
        "method": "POST",
        "handler": "resetPassword"
    }
    ,
    {
        "origin": "CONTROLLER",
        "controller": "AuthRestController",
        "method": "POST",
        "handler": "refresh"
    }
]

export const weightListeners = [
    {
        "origin": "CONTROLLER",
        "controller": "WeightRecordRestController",
        "method": "POST",
        "handler": "create"
    }
]

export const dietListeners = [
        {
        "origin": "CONTROLLER",
        "controller": "MealRecordRestController",
        "method": "POST",
        "handler": "trackMealRecord"
    }
]

export const waterListeners = [
    {
        "origin": "CONTROLLER",
        "controller": "WaterRecordController",
        "method": "POST",
        "handler": "create"
    }
]