import { Collection } from "./collection";
import { CollectionFactory } from "./factory";
import { CollectionOptions } from "./models/collection.options";

export * from "./factory";
export * from "./models";
export * from "./datasource";
export { CollectionOptions, CollectionFactory, Collection };

let _defaultFactory: CollectionFactory;

/**
 * Get the default collection factory
 * @returns {CollectionFactory}
 */
export function defaultFactory(): CollectionFactory {
  if (!_defaultFactory) {
    _defaultFactory = new CollectionFactory("/api");
  }
  return _defaultFactory;
}

/**
 * Create or get a collection using the default factory
 * @param collectionName
 * @param {CollectionOptions} options
 * @param decorate
 * @returns {Collection<T>}
 */
export function collection<T>(collectionName: string, options?: CollectionOptions, decorate?: any): Collection<T> {
  return defaultFactory().collection(collectionName, options, decorate as any);
}

/**
 * Create collections with endpoints
 * @param expressApp
 * @param options
 */
export function apiServer(options: { [name: string]: CollectionOptions }, expressApp: any): CollectionFactory {
  return defaultFactory().apiServer(options, expressApp);
}
