import { Cache } from "./cache";
import { CacheEntry } from "./cache-entry";
import { Logger } from "@webscale/core";

const logger = Logger.create("core/cache");

export class LocalCache<T> implements Cache<T> {

  private readonly storage: Map<string, CacheEntry<T>> = new Map();
  private lastGC: number;

  constructor(private options: LocalCacheOptions = {}) {
    options.gcMaxSweep = options.gcMaxSweep || 60000;
    options.gcMinSweep = options.gcMinSweep || 5000;
    options.limit = options.limit || 10000;
    options.pressureRatio = options.pressureRatio || .9;
    setInterval(() => {
      this.garbageCollect();
    }, options.gcMaxSweep);
  }

  public evict(key: string): Promise<void> {
    this.storage.delete(key);
    logger.verbose(`evict ${key}`);
    return Promise.resolve();
  }

  public get(key: string): Promise<T | null> {
    let entry = this.storage.get(key);
    let value = entry ? entry.value : null;
    return Promise.resolve(value);
  }

  public getRaw(key: string): Promise<CacheEntry<T> | null> {
    let entry = this.storage.get(key);
    return Promise.resolve(entry || null);
  }

  public put(key: string, value: T, evictTimeout: number = undefined): Promise<T> {
    if (this.storage.size > (this.options.limit * this.options.pressureRatio)) {
      this.garbageCollect();
    }
    if (this.storage.size >= this.options.limit) {
      return Promise.reject(`Cache limit reached`);
    }

    let entry: CacheEntry<T> = {
      value: value,
      time: Date.now()
    };
    if (evictTimeout) {
      entry.timeout = evictTimeout;
    }
    this.storage.set(key, entry);
    logger.verbose(`put ${key}`);
    return Promise.resolve(value);
  }

  private garbageCollect() {
    if(this.lastGC + this.options.gcMinSweep < Date.now()){
      return;
    }
    this.storage.forEach((entry, key) => {
      if (entry.time + entry.timeout >= Date.now()) {
        this.storage.delete(key);
        logger.verbose(`gc timeout evict ${key}`);
      }
    });
    if (this.storage.size > (this.options.limit * this.options.pressureRatio)) {
      let evictEntries: Map<string, CacheEntry<T>> = new Map();
      let newestKey: number;
      let amount = this.storage.size - (this.options.limit * this.options.pressureRatio);
      this.storage.forEach((entry, key) => {
        if (evictEntries.size < amount) {
          evictEntries.set(key, entry);
          if (newestKey < entry.time) {
            newestKey = entry.time;
          }
        } else if (entry.time < newestKey) {
          let latestKey: string;
          let latestTime: number = Date.now();
          evictEntries.forEach((entry, key) => {
            if (entry.time > latestTime) {
              latestKey = key;
              latestTime = entry.time;
            }
          });
          if (latestKey) {
            evictEntries.delete(latestKey);
            evictEntries.set(key, entry);
            if (newestKey < entry.time) {
              newestKey = entry.time;
            }
          }
        }
      });
      evictEntries.forEach((entry, key) => {
        this.storage.delete(key);
        logger.verbose(`gc pressure evict ${key}`);
      })
    }
    this.lastGC = Date.now();
  }

}

export interface LocalCacheOptions {

  gcMaxSweep?: number;
  gcMinSweep?: number;
  limit?: number;
  pressureRatio?: number;

}
