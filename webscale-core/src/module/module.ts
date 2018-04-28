import { App } from "./app";

export interface Module {

  readonly name: string;

  load(app: App): Promise<void>;

}
