import { CollectionFactory, CollectionOptions } from "@webscale/collection";
import { createExpressRoutes } from "./factory";

export * from "./factory";

/**
 * Create collections with endpoints
 * @param expressApp
 * @param options
 */
export function apiServer(options: { [name: string]: CollectionOptions }, expressApp: any): CollectionFactory {
  for (let collectionName in options) {
    this.collection(collectionName, options[collectionName]);
  }
  createExpressRoutes(expressApp, this);
  return this;
}