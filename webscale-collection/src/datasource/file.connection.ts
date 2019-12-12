import { Logger } from "@webscale/core";
import * as fs from "fs";
import * as pathUtil from "path";
import { Observable, Subject } from "rxjs";
import { filter } from "rxjs/operators";
import { Collection } from "../collection";
import { DatasourceEvent, DatasourceEventType } from "./datasource.event";
import { KeyValueConnection } from "./key-value.connection";

const logger = Logger.create("@webscale/datasource");

/**
 * File key-value datasource
 */
export class FileConnection<T> extends KeyValueConnection<T> {

  private collections = new Map();
  private stream: Subject<DatasourceEvent<T>> = new Subject<DatasourceEvent<T>>();

  constructor(private storageDirectory: string) {
    super();
  }

  public close(): void {
    // not implemented
  }

  public watch(collection: Collection<T>): Observable<DatasourceEvent<T>> {
    return this.stream.pipe(filter(item => item.collection === collection.name));
  }

  protected async saveForPath(collection: Collection<T>, pathSegments: string[], item: T): Promise<T> {
    let basename = encodeURIComponent(pathSegments.splice(pathSegments.length - 1, 1)[0]);
    let folder = `${this.storageDirectory}/${encodeURIComponent(collection.name)}/${pathSegments.map(
      segment => encodeURIComponent(segment)).join("/")}`;
    let file = folder + "/" + basename;

    let previousItemRaw = await this.readFile(file);
    let previousItem = previousItemRaw ? JSON.parse(previousItemRaw.toString()) : undefined;

    await this.mkdirp(folder);
    await this.writeFile(folder + "/" + encodeURIComponent(basename), JSON.stringify(item));

    this.stream.next({
      type: previousItem !== undefined ? DatasourceEventType.UPDATED : DatasourceEventType.CREATED,
      id: pathSegments.join("/"),
      collection: collection.name,
      before: previousItem ? JSON.parse(previousItem) : undefined,
      after: item
    });
    return item;
  }

  protected async getForPath(collection: Collection<T>, pathSegments: string[]): Promise<T | undefined> {
    let basename = encodeURIComponent(pathSegments.splice(pathSegments.length - 1, 1)[0]);
    let folder = `${this.storageDirectory}/${encodeURIComponent(collection.name)}/${pathSegments.map(
      segment => encodeURIComponent(segment)).join("/")}`;
    let file = folder + "/" + basename;

    let previousItemRaw = await this.readFile(file);
    return previousItemRaw ? JSON.parse(previousItemRaw.toString()) : undefined;
  }

  protected async getKeys(collection: Collection<T>, pathSegments: string[]): Promise<string[] | undefined> {
    let folder = `${this.storageDirectory}/${encodeURIComponent(collection.name)}/${pathSegments.map(
      segment => encodeURIComponent(segment)).join("/")}`;

    return (await this.listFiles(folder)).map(filename => decodeURIComponent(filename));
  }

  protected deleteForPath(collection: Collection<T>, pathSegments: string[]): Promise<boolean> {
    let basename = encodeURIComponent(pathSegments.splice(pathSegments.length - 1, 1)[0]);
    let folder = `${this.storageDirectory}/${encodeURIComponent(collection.name)}/${pathSegments.map(
      segment => encodeURIComponent(segment)).join("/")}`;
    let file = folder + "/" + basename;

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

  private readFile(file: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      fs.readFile(file, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  private writeFile(file: string, data: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(file, data, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private listFiles(folder: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(folder, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      });
    });
  }

  private mkdirp(folder: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      pathUtil.basename(pathUtil.dirname(folder));
      // todo: make recursive
      fs.mkdir(folder, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

}
