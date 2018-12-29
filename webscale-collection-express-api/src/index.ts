import { CollectionFactory, CollectionOptions, defaultFactory } from "@webscale/collection";
import { Application } from "express";
import { createExpressRoutes, createExpressSwaggerRoute } from "./factory";

export * from "./factory";

/**
 * Create collections with endpoints
 * @param collections
 * @param options
 */
export function apiServer(collections: { [name: string]: CollectionOptions },
                          options: ApiServerOptions): CollectionFactory {
  let factory = options.collectionFactory || defaultFactory();
  for (let collectionName in collections) {
    factory.collection(collectionName, collections[collectionName]);
  }
  createExpressRoutes(options.express, this);
  if (options && options.apiDocs) {
    createExpressSwaggerRoute(options.express, factory);
  }
  return this;
}

export interface ApiServerOptions {
  express: Application;
  apiDocs?: boolean;
  collectionFactory?: CollectionFactory;
}