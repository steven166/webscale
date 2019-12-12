import * as fs from "fs";

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