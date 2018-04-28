import { Server } from "../rest-client/server-discovery/server.model";
import { CacheMessage } from "./cache-message";
import { Socket } from "net";
import { Logger } from "@webscale/core";
import { Observable, Subject } from "rxjs";

const logger = Logger.create("core/cache");

export class Peer<T = any> {

  private queue: Subject<CacheMessage<T>> = new Subject();
  private socket: Socket;
  private resumeCallback: () => void;
  private _connected: boolean = false;
  private reconnectBackPressure = 0;
  private _closed: boolean = false;

  constructor(public readonly server: Server) {
    this.connect();
    this.queue.mergeMap(message => {
      return this.send(message);
    }, null, 1).subscribe(() => {

    }, err => logger.error(err));
  }

  public get connected(): boolean {
    return this._connected;
  }

  public get closed(): boolean {
    return this._closed;
  }

  public close(): Promise<void> {
    this._closed = true;
    return new Promise((resolve, reject) => {
      this.socket.destroy(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      })
    });
  }

  public send(message: CacheMessage<T>): Observable<void> {
    return Observable.create(observer => {
      this.ensureConnected().then(() => {
        this.socket.write(JSON.stringify(message));
      });
    }).retry(3);
  }

  public evict(key: string): void {
    let message: CacheMessage<T> = {
      type: "EVICT",
      time: Date.now(),
      key
    };
    this.queue.next(message);
  }

  public put(key: string, value: T, evictTimeout?: number): void {
    let message: CacheMessage<T> = {
      type: "PUT",
      time: Date.now(),
      key,
      value
    };
    if (evictTimeout) {
      message.timeout = evictTimeout;
    }
    this.queue.next(message);
  }

  private connect(): void {
    logger.info(`Connect to ${this.server.host}:${this.server.port}`);
    this.socket = new Socket();
    this.socket.connect(this.server.port, this.server.host, () => {
      if(this._closed){
        this.socket.end();
      } else {
        this._connected = true;
        this.reconnectBackPressure--;
        if (this.resumeCallback) {
          this.resumeCallback();
        }
      }
    });

    this.socket.on("error", error => {
      logger.warn(error);
    });
    this.socket.on("close", () => {
      this._connected = false;
      if(!this._closed) {
        this.reconnectBackPressure++;
        logger.warn(
          `Disconnected from peer ${this.server.host}:${this.server.port}, retry in ${100 * this.reconnectBackPressure}`);
        setTimeout(() => {
          this.connect();
        }, 100 * this.reconnectBackPressure);
      }
    });
  }

  private ensureConnected(): Promise<void> {
    return new Promise(resolve => {
      if (this._connected) {
        resolve();
      } else {
        this.resumeCallback = resolve;
      }
    });
  }

}
