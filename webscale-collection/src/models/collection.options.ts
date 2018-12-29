import { Collection } from "../collection";
import { JSONSchema7 } from "json-schema";
import { Datasource } from "../datasource";

/**
 * Options to create a new collection
 */
export interface CollectionOptions {

  singularName: string;
  version?: string;
  schema?: JSONSchema7;
  readonly?: boolean;
  basePath?: string;
  parent?: string | Collection<any>;
  datasource?: Datasource;
  children?: { [name: string]: CollectionOptions };

}
