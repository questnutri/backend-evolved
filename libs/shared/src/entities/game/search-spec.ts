import { PropertyType } from "./property-type.enum";

export interface SearchSpec {
    // A reference to where the value is found
    foundAt?: string;

    // The specific property to map the value from
    mappedBy?: string;

    // The data type of the computed value
    propertyType?: PropertyType;
}