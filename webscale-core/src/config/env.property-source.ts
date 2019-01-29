import { PropertySource } from "./property-source";

/**
 * PropertySource based on environments variable
 */
export class EnvPropertySource extends PropertySource {

  constructor() {
    super();
  }

  /**
   * Do nothing
   * @returns {Promise<void>}
   */
  public load(): Promise<PropertySource> {
    let source = {};
    for (let key in process.env) {
      if (process.env[key]) {
        // parse value
        let value: any = process.env[key];
        if (value.toLowerCase() === "true") {
          value = true;
        } else if (value.toLowerCase === "false") {
          value = false;
        } else {
          try {
            value = parseFloat(value);
          } catch (e) {
            // do nothing
          }
        }

        let segments = key.split("_");
        let scope = source;
        for (let i = 0; i < segments.length; i++) {
          let segment = segments[i];
          let last = i + 1 === segments.length;
          if (last) {
            scope[segment] = value;
          } else if (scope[segment] === undefined || typeof(scope) !== "object") {
            scope[segment] = {};
          }
          scope = scope[segment];
        }
      }
    }
    return Promise.resolve(source as any);
  }

}
