import {Message} from "./message";

export class Job<T = any> extends Promise<T>{

  private resolve: (result: T) => void;
  private reject: (error?: any) => void;
  public retryCount = 0;

  constructor(public readonly message: Message<T>) {
    super((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  public get name(): string {
    return this.message.call;
  }

  public onMessage(message: T | Error): void {
    if (message instanceof Error) {
      this.reject(message);
    } else {
      this.resolve(message);
    }
  }

}
