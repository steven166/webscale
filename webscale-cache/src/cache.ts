import { CacheEntry } from "./cache-entry";

export interface Cache<T> {

  put(key: string, value: T, evictTimeout?: number): Promise<T>;
  get(key: string): Promise<T>;
  getRaw(key: string): Promise<CacheEntry<T>>;
  evict(key: string): Promise<void>;

}
