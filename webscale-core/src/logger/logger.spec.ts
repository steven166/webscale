import { Logger } from "./logger";
import { assert } from "chai";

describe("@webscale/core/logger", () => {

  it("Create a logger for the default namespace", () => {
    let logger = Logger.create();

    assert.equal(logger.namespace, "default");
  });

  it("Create a logger for a specific namespace", () => {
    let logger = Logger.create("my-namespace");

    assert.equal(logger.namespace, "my-namespace");
  });

  it("Reuse loggers", () => {
    let logger1 = Logger.create("my-reuse-logger");
    let logger2 = Logger.create("my-reuse-logger");
    let logger3 = Logger.create("my-reuse-logger2");

    assert.equal(logger1, logger2);
    assert.notEqual(logger3, logger1);
  });

});