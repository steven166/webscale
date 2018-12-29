/**
 * Utils for object manipulation
 */
export class ObjectUtils {

  /**
   * Deep merge 2 objects
   * @param o1
   * @param o2
   * @returns {any}
   */
  public static deepMerge(o1: any, o2: any): any {
    if (typeof(o1) !== typeof(o2)) {
      return o2;
    }
    if (typeof(o1) === "object") {
      for (let property in o2) {
        if (o2[property]) {
          if (o1[property]) {
            o1[property] = ObjectUtils.deepMerge(o1[property], o2[property]);
          } else {
            o1[property] = o2[property];
          }
        }
      }
    } else {
      return o2;
    }
  }

  /**
   * Deep freeze an object
   * @param o
   */
  public static deepFreeze(o: any): any {
    if (o && typeof(o) === "object") {
      for (let property in o) {
        if (o[property]) {
          o[property] = ObjectUtils.deepFreeze(o[property]);
        }
      }
      Object.freeze(o);
    }
    return o;
  }

}
