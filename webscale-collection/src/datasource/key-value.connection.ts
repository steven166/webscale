import { BadRequestError, Logger, LogLevel } from "@webscale/core";
import { Observable } from "rxjs";
import { Collection } from "../collection";
import { Filter, Ids } from "../models";
import { Connection } from "./connection";

const logger = Logger.create("@webscale/datasource");

/**
 * Connection to store data with a key-value structure
 */
export abstract class KeyValueConnection<T> extends Connection<T> {

  public save(collection: Collection<T>, item: T): Promise<T> {
    let pathSegments = this.getItemPath(collection, item);
    if (logger.shouldLog(LogLevel.DEBUG)) {
      logger.debug(`save ${collection.name}>${pathSegments.join("/")}=${JSON.stringify(item)}`);
    }
    return this.saveForPath(collection, pathSegments, item);
  }

  public async get(collection: Collection<T>, search: Ids): Promise<T | undefined> {
    let pathSegments = this.getItemPath(collection, search);
    let item = await this.getForPath(collection, pathSegments);
    if (logger.shouldLog(LogLevel.DEBUG)) {
      logger.debug(`get ${collection.name}>${pathSegments.join("/")}=${JSON.stringify(item)}`);
    }
    return item;
  }

  public getAll(collection: Collection<T>, search: Ids): Observable<T> {
    let pathSegments = this.getCollectionPath(collection, search);
    return Observable.create(observer => {
      this.getKeys(collection, pathSegments).then(keys => {
        if (!keys) {
          return observer.complete();
        }
        let index = 0;
        let next = () => {
          let key = keys[index++];
          if (!key) {
            observer.complete();
          } else {
            let subPathSegments = [];
            subPathSegments.push(...pathSegments, key);
            this.getForPath(collection, subPathSegments).then(item => {
              if (logger.shouldLog(LogLevel.DEBUG)) {
                logger.debug(`getAll ${collection.name}>${subPathSegments.join("/")} (${index})=${JSON.stringify(item)}`);
              }
              observer.next(item);
              next();
            }).catch(e => observer.error(e));
          }
        };
        next();
      }).catch(e => observer.error(e));
    });
  }

  public async delete(collection: Collection<T>, search: Ids): Promise<boolean> {
    let pathSegments = this.getItemPath(collection, search);
    let deleted = await this.deleteForPath(collection, pathSegments);
    if (logger.shouldLog(LogLevel.DEBUG)) {
      logger.debug(`delete ${collection.name}>${pathSegments.join("/")}=${deleted}`);
    }
    return deleted;
  }

  /**
   * Get Path of this collection for storing/searching it in the key-value datastore
   * @param collection
   * @param {Filter} filter
   * @returns {string}
   */
  protected getCollectionPath(collection: Collection<T>, filter: Filter = {}): string[] {
    let segments: string[] = [];
    let missingFields: string[] = [];
    collection.parentPrimaryFields.forEach(field => {
      if (filter[field]) {
        segments.push(filter[field]);
      } else {
        missingFields.push(field);
      }
    });
    if (missingFields.length > 0) {
      throw new BadRequestError(`Missing fields: ${missingFields.join(", ")}`);
    }
    return segments.map(segment => encodeURIComponent(segment));
  }

  /**
   * Get Path of an item for storing/searching it in the key-value datastore
   * @param collection
   * @param {Filter} filter
   * @returns {string}
   */
  protected getItemPath(collection: Collection<T>, filter: Filter = {}): string[] {
    let segments: string[] = [];
    let missingFields: string[] = [];
    collection.parentPrimaryFields.concat(collection.primaryFields).forEach(field => {
      if (filter[field]) {
        segments.push(filter[field]);
      } else {
        missingFields.push(field);
      }
    });
    if (missingFields.length > 0) {
      throw new BadRequestError(`Missing fields: ${missingFields.join(", ")}`);
    }
    return segments.map(segment => encodeURIComponent(segment));
  }

  protected abstract saveForPath(collection: Collection<T>, pathSegments: string[], item: T): Promise<T>;

  protected abstract getForPath(collection: Collection<T>, pathSegments: string[]): Promise<T | undefined>;

  protected abstract deleteForPath(collection: Collection<T>, pathSegments: string[]): Promise<boolean>;

  protected abstract getKeys(collection: Collection<T>, pathSegments: string[]): Promise<string[] | undefined>;

}
