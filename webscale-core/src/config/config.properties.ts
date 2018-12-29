import { Config } from "./config";
import { PropertySource } from "./property-source";

export interface ConfigProperties {

  sources?: Array<PropertySource | ((config?: Config) => PropertySource) | any>;

}
