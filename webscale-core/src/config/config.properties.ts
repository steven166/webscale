import {PropertySource} from "./property-source";
import {Config} from "./config";

export interface ConfigProperties {

  sources?: Array<PropertySource | ((config?: Config) => PropertySource) | any>;

}
