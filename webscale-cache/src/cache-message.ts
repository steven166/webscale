import { CacheEntry } from "./cache-entry";

export interface CacheMessage<T = any> extends CacheEntry<T>{

  type: "PUT"| "EVICT";
  key: string;

}