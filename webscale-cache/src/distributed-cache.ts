import { DynamicServerList, ServerList } from "@webscale/server-discovery";
import { Peer } from "./peer";
import { LocalCache } from "./local-cache";
import { Cache } from "./cache";
import { CacheEntry } from "./cache-entry";
import { createServer, Server, Socket } from "net";
import { Logger } from "@webscale/core";
import { CacheMessage } from "./cache-message";

const logger = Logger.create("core/cache");

export class DistributedCache<T = any> implements Cache<T> {

  private localCache: LocalCache<T>;
  private peers: Peer[] = [];
  private server: Server;
  private incommingConnections: number = 0;

  constructor(private options: DistributedCacheOptions) {
    this.localCache = new LocalCache();
    this.peers = options.serverList.servers.map(server => new Peer(server));

    if (options.serverList instanceof DynamicServerList) {
      options.serverList.onChange((createdServers, removedServers) => {
        createdServers.forEach(server => this.peers.push(new Peer(server)));
        removedServers.forEach(server => {
          let index = this.peers.findIndex(peer => peer.server.name === server.name);
          let removedPeer = this.peers.splice(index, 1)[0];
          removedPeer && removedPeer.close().catch(e => logger.warn(`Failed to close peer`));
        });
      });
    }
  }

  /**
   * Open socket server
   * @returns {Promise<void>}
   */
  public open(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        reject("Server already opened");
      } else {
        let server = createServer(socket => this.handleConnection(socket));
        server.on("error", err => {
          reject(err);
        });
        server.listen(this.options.port,() => {
          logger.info(`Cache server bound to port ${this.options.port}`);
          this.server = server;
          resolve();
        })
      }
    });
  }

  /**
   * Handle incomming connection
   * @param {"net".Socket} socket
   */
  private handleConnection(socket: Socket): void {
    logger.info(`Peer from ${socket.remoteAddress} connected`);
    this.incommingConnections++;
    socket.on("data", data => {
      try {
        let json = JSON.parse(data.toString("UTF8")) as CacheMessage<T>;
        if ((json.type === "EVICT" || json.type === "PUT") &&
          typeof(json.key) === "string" && json.key.length > 0 &&
          typeof(json.time) === "number" && json.time > 0) {
          if (json.type === "PUT") {
            if (json.value !== undefined && (json.timeout === undefined || typeof(json.timeout) === "number")) {
              this.receivePut(json);
            } else {
              throw new Error(`Invalid message`);
            }
          } else if (json.type === "EVICT") {
            this.receiveEvict(json);
          }
        } else {
          throw new Error(`Invalid message`);
        }
      } catch (e) {
        logger.warn(`Unable to handle message from peer ${socket.remoteAddress}`);
      }
    });
    socket.on("error", error => {
      logger.error(`Error from peer ${socket.remoteAddress}`, error);
    });
    socket.on("end", () => {
      this.incommingConnections--;
    })
  }

  /**
   * Handle put message
   * @param {CacheMessage<T>} message
   */
  private receivePut(message: CacheMessage<T>): void {
    this.localCache.getRaw(message.key).then(existingEntry => {
      if (!existingEntry || (existingEntry && existingEntry.time < message.time)) {
        this.localCache.put(message.key, message.value, message.timeout).catch(e => logger.error(e));
      }
    }).catch(e => logger.error(e));
  }

  /**
   * Handle evict message
   * @param {CacheMessage<T>} message
   */
  private receiveEvict(message: CacheMessage<T>): void {
    this.localCache.getRaw(message.key).then(existingEntry => {
      if (existingEntry && existingEntry.time < message.time) {
        this.localCache.evict(message.key).catch(e => logger.error(e));
      }
    }).catch(e => logger.error(e));
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close(error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
      this.peers.forEach(peer => peer.close());
    });
  }

  public evict(key: string): Promise<void> {
    this.localCache.evict(key);
    this.peers.forEach(peer => {
      peer.evict(key);
    });
    return Promise.resolve();
  }

  public get(key: string): Promise<T> {
    return this.localCache.get(key);
  }

  public getRaw(key: string): Promise<CacheEntry<T>> {
    return this.localCache.getRaw(key);
  }

  public put(key: string, value: T, evictTimeout?: number): Promise<T> {
    return new Promise((resolve, reject) => {
      this.localCache.put(key, value, evictTimeout).then(result => {
        this.peers.forEach(peer => {
          peer.put(key, value, evictTimeout);
        });
        return resolve(result);
      }).catch(e => reject(e));
    });
  }

  public getOutgoingPeers(): number {
    return this.peers.filter(peer => peer.connected).length;
  }

  public getIncommingPeers(): number {
    return this.incommingConnections;
  }


}

export interface DistributedCacheOptions {
  port: number;
  host?: number;
  serverList: ServerList
}
