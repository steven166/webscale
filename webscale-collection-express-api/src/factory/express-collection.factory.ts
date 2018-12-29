import { Collection, CollectionFactory, defaultFactory } from "@webscale/collection";
import { Logger, MethodNotAllowedError } from "@webscale/core";
import { Application, NextFunction, Response } from "express";
import * as fs from "fs";
import * as pathUtil from "path";
import { Observable } from "rxjs";

const logger = Logger.create("@webscale/collection-express-api");

/**
 * Generate collection routes for express
 * @param {CollectionFactory} collectionFactory
 * @param {e.Application} express
 */
export function createExpressRoutes(express: Application, collectionFactory: CollectionFactory = defaultFactory()) {

  collectionFactory.getCollections().forEach(collection => {
    let path = getEndpointPath(collection);
    let itemPath = path + getFieldPath(collection);

    express.get(path, (req, res, next) => {
      let includes = req.query && req.query.includes && req.query.includes.split(",") || [];
      observableToJsonResponse(collection.getAll({ query: req.params, includes }), res, next);
    });

    express.get(itemPath, async (req, res, next) => {
      let includes = req.query && req.query.includes && req.query.includes.split(",") || [];
      let item = await collection.getItem({ query: req.params, includes });
      if (item) {
        res.json(item);
      } else {
        next();
      }
    });

    if (!collection.readonly) {
      express.post(path, async (req, res, next) => {
        let item = req.body;
        for (let field in req.params) {
          item[field] = req.params[field];
        }
        let result = await collection.saveItem(item);
        res.status(201).json(result);
      });
      express.put(itemPath, async (req, res, next) => {
        let item = req.body;
        for (let field in req.params) {
          item[field] = req.params[field];
        }
        let result = await collection.saveItem(item);
        res.status(201).json(result);
      });

      express.delete(itemPath, async (req, res, next) => {
        let deleted = await collection.deleteItem(req.params);
        if (deleted) {
          res.sendStatus(204);
        } else {
          next();
        }
      });

      express.use(path, (req, res, next) => {
        if (req.method === "get" || (!collection.readonly && req.method === "post")) {
          next();
        } else {
          next(new MethodNotAllowedError(req.method));
        }
      });

      express.use(itemPath, (req, res, next) => {
        if (req.method === "get" || (!collection.readonly && (req.method === "put" || req.method === "delete"))) {
          next();
        } else {
          next(new MethodNotAllowedError(req.method));
        }
      });
    }

  });

}

/**
 * Create swagger docs route
 * @param express
 * @param {CollectionFactory} collectionFactory
 */
export function createExpressSwaggerRoute(express: Application,
                                          collectionFactory: CollectionFactory = defaultFactory()) {
  let packageJson = findPackageJson();

  let docs: any = {};
  if (packageJson) {
    docs.info = {
      title: packageJson.name,
      version: packageJson.version,
      description: packageJson.description
    };
    if (packageJson.license && typeof(packageJson.license) === "string") {
      docs.info.license = {
        name: packageJson.license
      };
    }
  }
  for (let collection of collectionFactory.getCollections()) {
    if (!docs.components) {
      docs.components = {};
    }
    if (!docs.components.schemas) {
      docs.components.schemas = {};
    }
    docs.components.schemas[collection.name] = collection.schema || { type: "any" };

    if (!docs.paths) {
      docs.paths = {};
    }
    let path = getEndpointPath(collection, "swagger");
    let itemPath = path + getFieldPath(collection, "swagger");
    let pathParams = getEndpointAllParams(collection);
    let itemPathParams = getEndpointParams(collection).concat(pathParams);

    docs.paths[path] = {
      get: {
        tags: [collection.name],
        summary: `Get all ${collection.name}`,
        operationId: `list${collection.name.substring(0, 1).toUpperCase()}${collection.name.substring(1)}`,
        parameters: pathParams,
        responses: {
          200: {
            description: `List of ${collection.name}`,
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: `#/components/schemas/${collection.name}`
                  }
                }
              }
            }
          },
          404: {
            description: "Not Found"
          }
        }
      }
    };
    if (!collection.readonly) {
      docs.paths[path].post = {
        tags: [collection.name],
        summary: `Create or update ${collection.singularName}`,
        operationId: `post${collection.singularName.substring(0, 1).toUpperCase()}${collection.singularName.substring(
          1)}`,
        parameters: pathParams,
        requestBody: {
          description: `${collection.singularName}`,
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: `#/components/schemas/${collection.name}`
              }
            }
          }
        },
        responses: {
          201: {
            description: `Created ${collection.singularName}`,
            content: {
              "application/json": {
                schema: {
                  $ref: `#/components/schemas/${collection.name}`
                }
              }
            }
          },
          404: {
            description: "Not Found"
          }
        }
      };
    }
    docs.paths[itemPath] = {
      get: {
        tags: [collection.name],
        summary: `Get ${collection.singularName}`,
        operationId: `get${collection.singularName.substring(0, 1).toUpperCase()}${collection.singularName.substring(
          1)}`,
        parameters: itemPathParams,
        responses: {
          200: {
            description: `${collection.singularName}`,
            content: {
              "application/json": {
                schema: {
                  $ref: `#/components/schemas/${collection.name}`
                }
              }
            }
          },
          404: {
            description: "Not Found"
          }
        }
      }
    };
    if (!collection.readonly) {
      docs.paths[itemPath].put = {
        tags: [collection.name],
        summary: `Create or update ${collection.singularName}`,
        operationId: `put${collection.singularName.substring(0, 1).toUpperCase()}${collection.singularName.substring(
          1)}`,
        parameters: itemPathParams,
        requestBody: {
          description: `${collection.singularName}`,
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: `#/components/schemas/${collection.name}`
              }
            }
          }
        },
        responses: {
          200: {
            description: `Updated ${collection.singularName}`,
            content: {
              "application/json": {
                schema: {
                  $ref: `#/components/schemas/${collection.name}`
                }
              }
            }
          },
          404: {
            description: "Not Found"
          }
        }
      };
      docs.paths[itemPath].delete = {
        tags: [collection.name],
        summary: `Delete ${collection.singularName}`,
        operationId: `delete${collection.singularName.substring(0, 1).toUpperCase()}${collection.singularName.substring(
          1)}`,
        parameters: itemPathParams,
        responses: {
          204: {
            description: `Deleted ${collection.singularName}`
          },
          404: {
            description: "Not Found"
          }
        }
      };
    }

  }

  express.get(`${collectionFactory.basePath}/docs`, (req, res, next) => {
    res.json(docs);
  });

  express.use(`${collectionFactory.basePath}/docs`, (req, res, next) => {
    if (req.method === "get") {
      next();
    } else {
      next(new MethodNotAllowedError(req.method));
    }
  });

}

/**
 * Find first package.json
 * @returns {any}
 */
function findPackageJson(): any {
  let path = module.parent.filename;
  let segments = path.split(pathUtil.sep);
  let distPath = "";
  for (let segment of segments) {
    distPath += pathUtil.sep + segment;
    if (fs.existsSync(distPath + pathUtil.sep + "package.json")) {
      let json = fs.readFileSync(distPath + pathUtil.sep + "package.json");
      return JSON.parse(json.toString());
    }
  }
  return null;
}

function getEndpointAllParams(collection: Collection<any>): Array<{ in: "path", name: string, required: true }> {
  let params = [];
  let scope = collection.parent;
  while (scope) {
    params.push(...getEndpointParams(scope));
    scope = scope.parent;
  }
  return params;
}

function getEndpointParams(collection: Collection<any>): Array<{ in: string, name: string, required: boolean }> {
  return collection.primaryFields.map(field => {
    return {
      in: "path",
      required: true,
      name: field
    };
  });
}

function getEndpointPath(collection: Collection<any>, pattern: "express" | "swagger" = "express"): string {
  let path = `${collection.basePath}/${collection.version}`;
  let chain: Array<Collection<any>> = [];
  let scope = collection.parent;
  while (scope) {
    chain.push(scope);
    scope = scope.parent;
  }
  for (let i = chain.length - 1; i >= 0; i--) {
    let c = chain[i];
    path += `/${c.name}${getFieldPath(c, pattern)}`;
  }
  path += `/${collection.name}`;
  return path;
}

function getFieldPath(collection: Collection<any>, pattern: "express" | "swagger" = "express"): string {
  return collection.primaryFields.map(field => {
    if (pattern === "express") {
      return ":" + field;
    } else {
      return `{${field}}`;
    }
  }).join("/");
}

function observableToJsonResponse(observable: Observable<any>, response: Response, next: NextFunction): void {
  let sendHeader = false;
  observable.subscribe(item => {
    if (!sendHeader) {
      response.set("content-type", "application/json").status(200);
      sendHeader = true;
      safeWrite(response, "[\n");
    }
    safeWrite(response, JSON.stringify(item) + "\n");
  }, e => {
    next(e);
  }, () => {
    if (!sendHeader) {
      response.set("content-type", "application/json").status(200);
      sendHeader = true;
      safeWrite(response, "[\n");
    }
    safeWrite(response, "]");
    response.end();
  });
}

function safeWrite(response: Response, msg: string): void {
  response.write(msg);
}
