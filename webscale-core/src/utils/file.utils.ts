import * as fs from "fs";
import * as yaml from "yamljs";

/**
 * Load data from file
 * @param filename
 */
export function fromFile<Buffer>(filename: string): Promise<Buffer> {
  return new Promise<any>((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export function fromJsonFile<T = any>(filename: string): Promise<T> {
  return fromFile(filename).then(data => JSON.parse(data.toString()));
}

export function fromYamlFile<T = any>(filename: string): Promise<T> {
  return fromFile(filename).then(data => yaml.parse(data.toString()));
}
