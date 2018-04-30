import {Message} from "./message";
import {Logger} from "@webscale/core";

const logger = Logger.create("@webscale/core");

process.on("message", (m: Message) => {
  if (m.type && m.call) {
    handleMessage(m);
  }
});

let running: boolean = false;

function handleMessage(message: Message) {
  try {
    if(running){
      throw new Error(`A job is already running on this worker`);
    }
    running = true;

    logger.debug(`Run job ${message.call}`);
    let instance = new message.type();
    let promise = Promise.resolve(instance[message.call](...message.args));

    promise.then(result => {
      running = false;
      logger.debug(`Completed job ${message.call}`);
      process.send(result);
    }).catch(e => {
      running = false;
      logger.debug(`Job ${message.call} failed`, e);
      process.send(e);
    });

  } catch (e) {
    running = false;
    logger.debug(`Job ${message.call} failed`, e);
    process.send(e);
  }
}