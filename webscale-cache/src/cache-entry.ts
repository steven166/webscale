
export interface CacheEntry<T = any> {

  value?: T;
  time: number;
  timeout?: number;

}