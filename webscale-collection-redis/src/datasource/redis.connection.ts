import { Collection, DatasourceEvent, KeyValueConnection } from "@webscale/collection";
import * as Redis from "ioredis";
import { Observable } from "rxjs";

export class RedisConnection<T> extends KeyValueConnection<T> {

  private _redis: Redis.Redis;

  constructor(redisOptions: Redis.RedisOptions) {
    super();
    this._redis = new Redis(redisOptions);
  }

  public watch(collection: Collection<T>): Observable<DatasourceEvent<T>> {
    throw new Error("Method not implemented.");
  }

  public close() {
    this._redis.disconnect();
  }

  protected saveForPath(collection: Collection<T>, pathSegments: string[], item: T): Promise<T> {
    return this._redis.getset(`${collection.name}:${pathSegments.join(":")}`, JSON.stringify(item)).then(result => {
      return item;
    });
  }

  protected getForPath(collection: Collection<T>, pathSegments: string[]): Promise<T> {
    return this._redis.get(`${collection.name}:${pathSegments.join(":")}`).then(value => JSON.parse(value));
  }

  protected deleteForPath(collection: Collection<T>, pathSegments: string[]): Promise<boolean> {
    return this._redis.del(`${collection.name}:${pathSegments.join(":")}`).then(count => count > 0);
  }

  protected getKeys(collection: Collection<T>, pathSegments: string[]): Promise<string[]> {
    return this._redis.keys(`${collection.name}:${pathSegments.join(":")}:*`);
  }
}