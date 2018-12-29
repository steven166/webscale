import { CollectionOptions } from "../models/collection.options";
import { Collection } from "../collection";
import { createExpressRoutes } from "./routes.factory";
import { Datasource } from "../datasource";

/**
 * Factory for creating and managing collections
 */
export class CollectionFactory {

  private collections: { [name: string]: Collection<any> } = {};
  private _datasource: Datasource;

  constructor(public readonly basePath: string) {
  }

  public get datasource(): Datasource {
    return this._datasource;
  }

  public set datasource(datasource: Datasource) {
    this._datasource = datasource;
  }

  /**
   * Create collections with endpoints
   * @param expressApp
   * @param options
   */
  public apiServer(options: { [name: string]: CollectionOptions }, expressApp: any): CollectionFactory {
    for (let collectionName in options) {
      this.collection(collectionName, options[collectionName]);
    }
    createExpressRoutes(expressApp, this);
    return this;
  }

  /**
   * Create or get a collection
   * @param collectionName
   * @param {CollectionOptions} options
   * @param decorate
   * @returns {Collection<T>}
   */
  public collection<T>(collectionName: string, options?: CollectionOptions, decorate?: any): Collection<T> {
    let existingCollection = this.getCollection(collectionName);
    if (existingCollection) {
      return existingCollection;
    }
    let parentCollection: Collection<any> = undefined;
    if (options.parent) {
      if (!(options.parent instanceof Collection)) {
        parentCollection = this.getCollection(options.parent);
        if (!parentCollection) {
          throw new Error(`Unknown parent collection: '${options.parent}'`);
        }
      }
    }
    let parendIdFields = parentCollection ? parentCollection.getIdFields() : [];

    let name = this.notEmpty("name", collectionName);
    let singularName = this.notEmpty("singularName", options.singularName);
    let version = this.notEmpty("version", options.version, "v1");
    let basePath = this.notEmpty("basePath", options.basePath || this.basePath, "/api");

    let collection = new Collection<T>(
      this,
      name,
      singularName,
      version,
      basePath,
      options.schema,
      options.readonly,
      [singularName + "Id"],
      parendIdFields,
      parentCollection,
      options.datasource);

    if (decorate) {
      for (let key in decorate) {
        if (decorate[key]) {
          Object.defineProperty(collection, key, decorate[key]);
        }
      }
    }

    this.collections[collectionName] = collection;
    Object.defineProperty(this, collectionName, collection);

    if (options.children) {
      for (let childName in options.children) {
        this.collection(childName, options.children[childName]);
      }
    }

    return collection as any;
  }

  /**
   * Find a collection by name
   * @param {string} name
   * @returns {Collection<T>}
   */
  public getCollection<T = any>(name: string): Collection<T> {
    return this.collections[name];
  }

  /**
   * Get collections
   * @returns {Collection<any>[]}
   */
  public getCollections(): Collection<any>[] {
    let list = [];
    for (let key in this.collections) {
      list.push(this.collections[key]);
    }
    return list;
  }

  /**
   * Check if value is not empty, throw error or fallback on defaultValue if provided
   * @param {string} field
   * @param {T} value
   * @param {T} defaultValue
   * @returns {T}
   */
  private notEmpty<T>(field: string, value: T, defaultValue?: T): T {
    if (value === undefined || value === null || (value as any) === "") {
      if (defaultValue) {
        return defaultValue;
      } else {
        throw new Error(`${field} is missing or empty`);
      }
    }
    return value;
  }

}
