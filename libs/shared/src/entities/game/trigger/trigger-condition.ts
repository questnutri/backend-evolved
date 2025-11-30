import { PropertyType } from "../property-type.enum";
import { SearchSpec } from "../search-spec";

export enum ConditionOperation {
    EQUAL = 'EQUAL',
    NOT_EQUAL = 'NOT_EQUAL',
    GREATER_THAN = 'GREATER_THAN',
    LESS_THAN = 'LESS_THAN',
    INCLUDES = 'INCLUDES',
    EXCLUDES = 'EXCLUDES'
}

export enum DateConditionOperation {
    DAY = 'day',
    MONTH = 'month',
    YEAR = 'year',
    WEEK = 'week',
    HOUR = 'hour',
    MINUTE = 'minute',
    SECOND = 'second'
}

export interface TriggerCondition extends SearchSpec {
    foundAt?: string;
    mappedBy?: string;
    propertyType?: PropertyType;
    conditionOperation?: ConditionOperation;
    oneOf?: string[];
    value?: string;
    compare: Required<Omit<SearchSpec, 'propertyType'>>;
    applyOperationOnDate?: DateConditionOperation;
}