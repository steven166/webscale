import { Observable } from "rxjs";
import { filter } from "rxjs/operators";
import { Collection } from "../collection";
import { Ids } from "../models";
import { DatasourceEvent } from "./datasource.event";

export abstract class Connection<T> {

  /**
   * Save item
   * @param collection
   * @param {T} item
   * @returns {Promise<T>}
   */
  public abstract save(collection: Collection<T>, item: T): Promise<T>;

  /**
   * Get item
   * @param collection
   * @param search
   * @returns {Promise<T | undefined>}
   */
  public abstract get(collection: Collection<T>, search: Ids): Promise<T | undefined>;

  /**
   * Get all items
   * @param collection
   * @param search
   * @returns {Observable<T>}
   */
  public abstract getAll(collection: Collection<T>, search: Ids): Observable<T>;

  /**
   * Delete item
   * @param collection
   * @param search
   * @returns {Promise<boolean>}
   */
  public abstract delete(collection: Collection<T>, search: Ids): Promise<boolean>;

  /**
   * Watch collection for changes
   * @param collection
   * @param search
   */
  public abstract watch(collection: Collection<T>): Observable<DatasourceEvent<T>>;

  /**
   * Watch collection for changes
   * @param collection
   * @param search
   */
  public watchByFilter(collection: Collection<T>, search: Ids): Observable<DatasourceEvent<T>> {
    return this.watch(collection).pipe(filter(item => {
      if (search) {
        if (item.before) {
          for (let field in search) {
            if (item.before[field] !== search[field]) {
              return false;
            }
          }
        } else if (item.after) {
          for (let field in search) {
            if (item.after[field] !== search[field]) {
              return false;
            }
          }
        } else {
          return false;
        }
      }
      return true;
    }));
  }

  /**
   * Close connection to the datastore
   */
  public abstract close();

}
