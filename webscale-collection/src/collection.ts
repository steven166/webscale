import { Connection, Datasource } from "./datasource";
import { BadRequestError, NotFoundError, Logger } from "@webscale/core";
import { Observable, Subject } from "rxjs";
import { Search, Filter, Ids, CollectionEvent, CollectionEventType } from "./models";
import { flatMap, filter, toArray } from 'rxjs/operators';
import * as Ajv from "ajv";
import { JSONSchema7 } from "json-schema";
import { CollectionFactory } from "./factory";
import { Context } from "./models/context";
import { log } from "util";

const logger = Logger.create("@webscale/collection");

export class Collection<T extends Filter> {

  private eventStream: Subject<CollectionEvent<T>> = new Subject();
  private schemaValidator: Ajv.ValidateFunction;

  public readonly children?: Collection<any>[] = [];

  constructor(public readonly factory: CollectionFactory,
              public readonly name: string,
              public readonly singularName: string,
              public readonly version: string,
              public readonly basePath: string,
              public readonly schema: JSONSchema7,
              public readonly readonly: boolean,
              public readonly primaryFields: string[],
              public readonly parentPrimaryFields: string[],
              public readonly parent: Collection<any>,
              public readonly datasource: Datasource) {
    if (!this.schema) {
      this.schema = {};
    }
    this.prepareSchema(this.schema);
    let ajv = new Ajv();
    // ajv.addMetaSchema(jsonSchemaDraft06);
    this.schemaValidator = ajv.compile(this.schema);

    if (parent) {
      parent.children.push(this);
      // Delete siblings when a parent is removed
      parent.watch(CollectionEventType.DELETED)
        .forEach(event => {
          try {
            this.getAll(event.ids).subscribe(item => {
              this.deleteItem(item).catch(e => {
                logger.warn(`Unable to remove ${this.singularName} ${this.getName(item)}`, e);
              });
            }, e => {
              logger.verbose(`Unable to remove children of ${event.collection}/${event.name}`, e);
            })
          } catch (e) {
            logger.verbose(`Unable to remove children of ${event.collection}/${event.name}`, e);
          }
        });
    }
  }

  public connection(context: Context): Connection<T> {
    if (this.datasource) {
      return this.datasource.getConnection(this, context);
    } else {
      return this.factory.datasource.getConnection(this, context);
    }
  }

  /**
   * Watch local changes
   * @returns {Observable<CollectionEvent<T extends Search>>}
   */
  public watch(eventType?: CollectionEventType): Observable<CollectionEvent<T>> {
    if (eventType) {
      return this.eventStream.pipe(filter(event => event.type === eventType));
    }
    return this.eventStream;
  }

  /**
   * Get all items
   * @param {Search} search
   * @param context
   * @returns {Observable<T extends Search>}
   */
  public getAll(search?: Search, context?: Context): Observable<T> {
    if (!search) {
      search = {};
    }
    let query = search.query || {};
    let includeCollections = this.getIncludeCollections(search);

    return this.connection(context).getAll(this, query).pipe(filter(item => {
      return this.filter(item, search);
    })).pipe(flatMap(async item => {
      // Include child collections if requested
      let includePromises = includeCollections.map(collection => {
        let subQuery = {};
        this.getIdFields().forEach(field => subQuery[field] = search.query[field]);
        return collection.getAll({ query: subQuery }, context).pipe(toArray()).toPromise()
          .then(result => {
            return { result, collection: collection.name }
          });
      });
      // Wait for all query's to finish
      let includeResults = await Promise.all(includePromises);

      // Add child results to mainResult
      includeResults.forEach(includeResult => {
        item[includeResult.collection] = includeResult.result;
      });

      return item;
    }));
  }

  /**
   * Get Item
   * @param {Search} search
   * @param context
   * @returns {Promise<T>}
   */
  public async getItem(search: Search, context?: Context): Promise<T | null> {
    if (!search) {
      throw new BadRequestError(`no Search is provided`);
    }
    if (!search.query) {
      search.query = {};
    }
    let includeCollections = this.getIncludeCollections(search);

    // Execute all query's in parallel
    let mainPromise = this.connection(context).get(this, search.query).then(result => {
      return { result, collection: this.name };
    });
    let includePromises = includeCollections.map(collection => {
      let subFilter = {};
      this.getIdFields().forEach(field => subFilter[field] = search.query[field]);
      return collection.getAll({ query: subFilter }).pipe(toArray()).toPromise()
        .then(result => {
          return { result, collection: collection.name }
        });
    });

    // Wait for all query's to finish
    let mainResult = await mainPromise;
    if (!mainResult || !mainResult.result) {
      // No main result
      return null;
    }
    let result = mainResult.result;

    if (!this.filter(result, search)) {
      return null;
    }

    for (let field in search.query) {
      if (result[field] !== search.query[field]) {
        // Result don't match filter
        return null;
      }
    }

    // Add child results to mainResult
    let results = await Promise.all(includePromises);
    results.forEach(includeResult => {
      result[includeResult.collection] = includeResult.result;
    });

    return result;
  }

  /**
   * Create or update item
   * @param {T} item
   * @param context
   * @returns {Promise<T extends Search>}
   */
  public async saveItem(item: T, context?: Context): Promise<T> {
    await this.validateItem(item);
    let existingItem = await this.connection(context).get(this, item);
    let result = await this.connection(context).save(this, item);

    this.eventStream.next({
      type: existingItem ? CollectionEventType.UPDATED : CollectionEventType.CREATED,
      collection: this.name,
      name: this.getName(item),
      ids: this.getIds(item),
      before: existingItem || undefined,
      after: result
    });

    return result;
  }

  /**
   * Delete an item
   * @param {Search} search
   * @param context
   * @returns {Promise<boolean>}
   */
  public async deleteItem(search: Search, context?: Context): Promise<boolean> {
    if (!search) {
      throw new BadRequestError(`no Search is provided`);
    }
    if (!search.query) {
      search.query = {};
    }
    let item = await this.connection(context).get(this, search.query);
    if (item) {
      if (await this.connection(context).delete(this, search.query)) {
        this.eventStream.next({
          type: CollectionEventType.DELETED,
          collection: this.name,
          name: this.getName(search.query),
          ids: this.getIds(search.query),
          before: item,
          after: undefined
        });

        return true;
      }
    }
    return false;
  }

  /**
   * Get Id fields
   * @returns {string[]}
   */
  public getIdFields(): string[] {
    return this.parentPrimaryFields.concat(this.primaryFields);
  }

  /**
   * Filter results with search query
   * @param item
   * @param search
   */
  private filter(item: T, search: Search): boolean {
    for (let field in search.query) {
      if (item[field] !== search.query[field]) {
        // Result don't match filter
        return false;
      }
    }
    return true;
  }

  /**
   * Validate item based on a JSON schema
   * @param {T} item
   * @returns {Promise<void>}
   */
  private async validateItem(item: T): Promise<void> {
    await this.checkParentsExists({ query: item });

    let valid = this.schemaValidator(item);
    if (!valid) {
      let errors = this.schemaValidator.errors.map(error => {
        return {
          message: error.message,
          data: error.data,
          field: error.dataPath
        };
      });
      throw new BadRequestError(`${this.singularName} is invalid`, errors);
    }
  }

  /**
   * Prepare schema validation
   * @param schema
   */
  private prepareSchema(schema: JSONSchema7): void {
    // Prevent async validation
    delete (schema as any).$async;

    // Set basic information
    schema.$schema = "http://json-schema.org/draft-07/schema#";
    schema.$id = this.singularName;
    schema.title = this.singularName;
    schema.type = "object";
    if (!schema.required) {
      schema.required = [];
    }

    // Set Primay fields as required
    this.getIdFields().forEach(field => {
      if (schema.required.indexOf(field) === -1) {
        schema.required.push(field);
      }
    });

    // Overwrite Primary field
    if (!schema.properties) {
      schema.properties = {};
    }

    this.getIdFields().forEach(field => {
      if (!schema.properties[field]) {
        schema.properties[field] = {};
      }
      let subSchema = schema.properties[field] as JSONSchema7;
      subSchema.$id = "#/properties/" + field;
      subSchema.type = "string";
      subSchema.title = field;
    });
  }

  /**
   * Check if parents exists
   * @param {Search} search
   * @returns {Promise<void>}
   */
  private async checkParentsExists(search: Search): Promise<void> {
    let scopeCollection: Collection<any> = this;
    let chain: Array<Collection<any>> = [];
    while (scopeCollection.parent) {
      scopeCollection = scopeCollection.parent;
      chain.push(scopeCollection);
    }
    for (let i = chain.length - 1; i >= 0; i--) {
      let parentCollection = chain[i];
      let parentFilter = {};
      parentCollection.getIdFields().forEach(field => parentFilter[field] = search.query[field]);
      if (!(await parentCollection.getItem({ query: parentFilter }))) {
        throw new NotFoundError(
          `${parentCollection.singularName} '${parentCollection.getName(parentFilter)}' not found`);
      }
    }
  }

  /**
   * Get collection to include in the response
   * @param search
   */
  private getIncludeCollections(search: Search): Collection<any>[] {
    if (search.includes) {
      let collections = search.includes.map(include => {
        return {
          name: include,
          collection: this.children.find(collection => collection.name === include.toLowerCase())
        };
      });
      let unknownCollections = collections.filter(c => c.collection === undefined);
      if (unknownCollections.length > 0) {
        throw new BadRequestError(`Unknown collections to include: ${unknownCollections.map(c => c.name).join(", ")}`);
      }
      return collections.map(c => c.collection);
    }
    return [];
  }

  /**
   * Get ids
   * @param {Search} filter
   * @returns {Ids}
   */
  private getIds(filter: Filter): Ids {
    let ids: Ids = {};
    this.parentPrimaryFields.concat(this.primaryFields).forEach(field => {
      ids[field] = filter[field];
    });
    return ids;
  }

  /**
   * Get simple name of an item
   * @param {Filter} filter
   * @returns {string}
   */
  private getName(filter: Filter): string {
    return this.primaryFields.map(field => filter[field]).join("-");
  }

}
