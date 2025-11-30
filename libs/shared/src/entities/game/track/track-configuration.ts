import { PropertyType } from "../property-type.enum";
import { SearchSpec } from "../search-spec";

export enum TrackType {
    //Counts the number of times an event has occurred
    COUNTER = 'COUNTER', //ADD, SUB

    //Holds a specific value that can be set or modified
    PROPERTY = 'PROPERTY', //SET, ADD, SUB
}

export enum UpdateOperation {
    // Directly sets the value
    SET = "SET",

    // Increases the value by a specified amount
    ADD = "ADD",
    
    // Decreases the value by a specified amount
    SUB = "SUB"
}



export interface TrackConfiguration {
    type: TrackType;
    initialValue?: string;
    updateOperation?: UpdateOperation;
    trackPropertyType?: PropertyType;
    directValue?: string;
    updateValue?: string;
    computedValue?: SearchSpec;
}