import {ChildProcess, fork} from "child_process";
import {Logger} from "@webscale/core";
import {Job} from "./job";

const logger = Logger.create("@webscale/worker");

export class Thread extends Promise<any> {

  private thread: ChildProcess;
  private job: Job;
  private resolve: (() => void);
  private _lastFinished: number = 0;

  constructor(private readonly module: string) {
    super((resolve, reject) => {
      this.resolve = resolve;
    });
  }

  public get lastFinished(): number {
    return this._lastFinished;
  }

  /**
   * Start new child process
   */
  public start(): void {
    this.thread = fork(this.module);
    this.thread.on("error", error => {
      logger.error(error);
      this.resolve();
    });
    this.thread.on("close", () => {
      this.resolve();
      if (this.job) {
        this.job.onMessage(new Error(`Worker closed`));
      }
    });
    this.thread.on("message", message => {
      if (this.job) {
        this.job.onMessage(message);
      } else {
        logger.warn("Received an unhandled message from worker");
      }
    });
  }

  /**
   * Stop child process
   */
  public stop() {
    if (this.thread) {
      if (this.job) {
        this.job.catch().then(() => {
          this.thread.disconnect();
        })
      } else {
        this.thread.disconnect();
      }
    }
  }

  /**
   * Is child process running and connected
   * @return {boolean}
   */
  public get active(): boolean {
    return this.thread && this.thread.connected;
  }

  /**
   * Is a job running on this thread
   * @return {boolean}
   */
  public get running(): boolean {
    return this.job !== undefined;
  }

  public get name(): string {
    return this.thread && `thread-${this.thread.pid}`;
  }

  /**
   * Signal child process to run this job
   * @param {Job} job
   * @return {Promise<void>}
   */
  public runJob(job: Job): Promise<void> {
    if (this.job) {
      throw new Error(`Thread is already occupied`)
    }
    this.job = job;
    return new Promise((resolve, reject) => {
      this.thread.send(job.message, error => {
        if (error) {
          this._lastFinished = Date.now();
          this.job = undefined;
          reject(error);
        } else {
          resolve();
          this.job.catch().then(() => {
            this._lastFinished = Date.now();
            this.job = undefined;
          });
        }
      });
    });
  }

}
