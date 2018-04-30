import {Logger} from "@webscale/core";
import {Message} from "./message";
import {Thread} from "./thread";
import {Job} from "./job";

let logger = Logger.create("@webscale/worker");

export class Worker {

  private lastThreadStarted: number = 0;
  private threads: Thread[] = [];
  private queuedJobs: Job[] = [];
  private scheduledJob: Job;
  private runningJobs: Job[] = [];
  private cleanupInterval: any;

  private isInit: boolean = false;
  private isDestroyed: boolean = false;

  private maxThreads: number;
  private minThreads: number;
  private threadSpawnInterval: number;
  private threadShrinkInterval: number;
  private jobRetryBackoff: number;

  constructor(options?: WorkerOptions) {
    this.maxThreads = options && options.threads || 4;
    this.minThreads = options && options.minThreads || 0;
    this.threadSpawnInterval = options && options.threadSpawnInterval || 1000;
    this.threadShrinkInterval = options && options.threadShrinkInterval || 30000;
    this.jobRetryBackoff = options && options.jobRetryBackoff || 1;
  }

  /**
   * Startup min number threads and create an interface to talk to
   * @param {{new(): T}} type
   * @return {T}
   */
  public init<T = (new () => any)>(type: (new () => T)): T {
    if (this.isInit) {
      throw new Error(`Worker is already initialized`);
    }
    this.isInit = true;

    // Spawn min number of threads
    for (let i = 0; i < this.minThreads; i++) {
      this.spawnThread();
    }
    // Clean idle threads
    this.cleanupInterval = setInterval(() => {
      if (this.threads.filter(t => t.active).length > this.minThreads) {
        let now = Date.now();
        let thread = this.threads.find(t => !t.running && t.lastFinished + this.threadShrinkInterval < now);
        if (thread) {
          thread.stop();
          let index = this.threads.indexOf(thread);
          if (index > -1) {
            this.threads.splice(index, 1);
          }
        }
      }
    }, 5000);

    // Create proxy class
    let proxyClass: any = {};
    let realClass = new type();
    for (let field in realClass) {
      if (typeof(realClass[field]) === "function") {
        proxyClass[field] = this.proxyFunction(field);
      }
    }

    return proxyClass as T;
  }

  /**
   * Destroy this worker
   */
  public destroy(): void {
    this.queuedJobs = [];
    this.scheduledJob = undefined;
    this.runningJobs = [];
    this.threads.forEach(t => t.stop());
    this.isDestroyed = true;
    clearInterval(this.cleanupInterval);
  }

  private proxyFunction(name: string, type: ((new () => any))) {
    return function () {
      return this.queue({call: name, args: arguments});
    };
  }

  /**
   * Create and queue a new Job
   * @param {Message} message
   * @return {Promise<any>}
   */
  private queue(message: Message): Promise<any> {
    let job = new Job(message);
    this.queuedJobs.push(job);
    this.scheduleJob();
    return job;
  }

  /**
   * Schedule the next job or spawn a new thread when needed
   */
  private scheduleJob(): void {
    if (!this.scheduledJob && this.queuedJobs.length > 0) {
      let thread = this.threads.find(t => !t.running && t.active);
      if (!thread) {
        if (this.threads.length < this.maxThreads && this.lastThreadStarted + this.threadSpawnInterval < Date.now()) {
          this.spawnThread();
        } else {
          return;
        }
      } else {
        this.scheduledJob = this.queuedJobs.pop();
        this.startJob();
      }
    }
  }

  /**
   * Start the next scheduled job
   */
  private startJob(): void {
    let thread = this.threads.find(t => !t.running && t.active);
    if (!thread) {
      if (this.threads.length < this.maxThreads && this.lastThreadStarted + this.threadSpawnInterval < Date.now()) {
        this.spawnThread();
      } else {
        return;
      }
    } else {
      logger.verbose(`Start job ${this.scheduledJob.name} on thread ${thread.name}`);
      let startTime = Date.now();
      thread.runJob(this.scheduledJob).then(() => {
        let job = this.scheduledJob;
        this.runningJobs.push(job);
        this.scheduledJob = undefined;

        job.then(() => {
          logger.debug(`Job ${job.name} completed in ${Date.now() - startTime}ms`);
        }).catch(e => {
          logger.warn(`Job ${job} failed: ${e.message}`);
        }).then(() => {
          let index = this.runningJobs.indexOf(job);
          if (index > -1) {
            this.runningJobs.splice(index, 1);
            this.scheduleJob();
          }
        });
        this.scheduleJob();
      }).catch(e => {
        this.scheduledJob.retryCount++;
        if (this.scheduledJob.retryCount > this.jobRetryBackoff) {
          this.scheduledJob = undefined;
          logger.error(`Failed to start job ${this.scheduledJob.name}`, e);
        } else {
          this.startJob();
        }
      });
    }
  }

  /**
   * Spawn a new thread
   */
  private spawnThread(): void {
    logger.debug("Spawn new thread");
    this.lastThreadStarted = Date.now();
    let thread = new Thread("./child-worker.js");
    thread.start();
    this.threads.push(thread);
    thread.then(() => {
      let index = this.threads.indexOf(thread);
      if (index > -1) {
        logger.debug(`Destroy thread`);
        this.threads.splice(index, 1);
      }
    });
    this.scheduleJob();
  }

}

export interface WorkerOptions {

  minThreads?: number;
  threads?: number;
  threadSpawnInterval?: number;
  threadShrinkInterval?: number;
  jobRetryBackoff?: number;
}
