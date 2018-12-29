import { Logger } from "@webscale/core";
import { KeyValueConnection } from "./key-value.connection";
import { Collection } from "../collection";
import { Observable, Subject } from "rxjs";
import { DatasourceEvent, DatasourceEventType } from "./datasource.event";
import { filter } from "rxjs/operators";

const logger = Logger.create("@webscale/datasource");

/**
 * In memory key-value datasource (for testing)
 */
export class InMemoryConnection<T> extends KeyValueConnection<T> {

  private collections = new Map();
  private stream: Subject<DatasourceEvent<T>> = new Subject<DatasourceEvent<T>>();

  protected saveForPath(collection: Collection<T>, pathSegments: string[], item: T): Promise<T> {
    if (!this.collections[collection.name]) {
      this.collections[collection.name] = new Map();
    }
    let scope = this.collections[collection.name];
    let basename = pathSegments.splice(pathSegments.length - 1, 1)[0];

    for (let segment of pathSegments) {
      if (!scope.get(segment)) {
        scope.set(segment, new Map());
      }
      if (scope.get(segment) instanceof Map) {
        scope = scope.get(segment);
      } else {
        throw new Error(`Unable to store '${pathSegments.join("/")}': conflict`);
      }
    }
    let previousItem = scope.get(basename);
    // Store new value
    scope.set(basename, JSON.stringify(item));

    this.stream.next({
      type: previousItem !== undefined ? DatasourceEventType.UPDATED : DatasourceEventType.CREATED,
      id: pathSegments.join("/"),
      collection: collection.name,
      before: previousItem ? JSON.parse(previousItem) : undefined,
      after: item
    });
    return Promise.resolve(item);
  }

  protected getForPath(collection: Collection<T>, pathSegments: string[]): Promise<T | undefined> {
    let collectionStore = this.collections[collection.name];
    if (collectionStore) {
      let item = this.getFromPath(collectionStore, pathSegments);
      if (item && !(item instanceof Map)) {
        return Promise.resolve(JSON.parse(item));
      }
    }
    return Promise.resolve(undefined);
  }

  protected getKeys(collection: Collection<T>, pathSegments: string[]): Promise<string[] | undefined> {
    let collectionStore = this.collections[collection.name];
    if (collectionStore) {
      let folder = this.getFromPath(collectionStore, pathSegments);
      if (folder && folder instanceof Map) {
        let iterator = folder.keys();
        let array: string[] = [];
        while (true) {
          let next = iterator.next();
          if (next.value !== undefined) {
            array.push(next.value);
          } else {
            break;
          }
        }
        return Promise.resolve(array);
      }
    }
    return Promise.resolve(undefined);
  }

  protected deleteForPath(collection: Collection<T>, pathSegments: string[]): Promise<boolean> {
    let collectionStore = this.collections[collection.name];
    if (collectionStore) {
      let parent = this.getParentFromPath(collectionStore, pathSegments);
      if (parent) {
        let basename = pathSegments[pathSegments.length - 1];
        let previousItem = parent.get(basename);
        if (previousItem && !(previousItem instanceof Map)) {
          parent.delete(basename);
          if (parent.size === 0) {
            let parentSegments = pathSegments.splice(pathSegments.length - 1, 1);
            this.deleteFolder(collectionStore, parentSegments);
          }

          this.stream.next({
            type: DatasourceEventType.DELETED,
            id: pathSegments.join("/"),
            collection: collection.name,
            before: JSON.parse(previousItem)
          });

          return Promise.resolve(true);
        }
      }
    }
    return Promise.resolve(false);
  }

  private deleteFolder(collection: Map<string, any>, segments: string[]): void {
    for (let i = segments.length - 1; i >= 1; i--) {
      let parentSegments = segments.splice(segments.length - 1, 1);
      let basename = segments[segments.length - 1];
      let parent = this.getFromPath(collection, parentSegments);
      if (!parent || !(parent instanceof Map)) {
        break;
      }
      let folder = parent.get(basename);
      if (folder && folder instanceof Map) {
        if (folder.size === 0) {
          parent.delete(basename);
        } else {
          break;
        }
      }
    }
  }

  private getParentFromPath(collection: Map<string, any>, pathSegments?: string[]): Map<string, any> | undefined {
    let parentSegments = [].concat(pathSegments);
    parentSegments.splice(parentSegments.length - 1, 1);
    let parent = this.getFromPath(collection, parentSegments);
    if (parent instanceof Map) {
      return parent;
    }
    return undefined;
  }

  private getFromPath(scope: Map<string, any>, pathSegments: string[]): string | Map<string, any> | undefined {
    if (!pathSegments || pathSegments.length === 0) {
      return scope;
    }
    for (let segment of pathSegments) {
      if (!scope || !(scope instanceof Map) || !scope.get(segment)) {
        return undefined;
      }
      scope = scope.get(segment);
    }
    return scope;
  }

  public close(): void {
    // not implemented
  }

  public watch(collection: Collection<T>): Observable<DatasourceEvent<T>> {
    return this.stream.pipe(filter(item => item.collection === collection.name));
  }

}
