import { DistributedCache } from "./distributed-cache";
import { ServerList } from "../rest-client/server-discovery/server-list";
import { assert } from "chai";

describe("Distributed Cache", () => {

  let dcs: DistributedCache[] = [];

  afterEach(async () => {
    await Promise.all(dcs.map(dc => dc.close()));
    dcs = [];
  });

  it("Connect 2 peers", async () => {
    let dc1 = new DistributedCache({
      port: 4000,
      serverList: new ServerList("dc", {
        servers: [{
          name: "dc2",
          host: "localhost",
          port: 4001,
          serviceId: "dc"
        }]
      })
    });
    dcs.push(dc1);
    await dc1.open();
    let dc2 = new DistributedCache({
      port: 4001,
      serverList: new ServerList("dc", {
        servers: [{
          name: "dc1",
          host: "localhost",
          port: 4000,
          serviceId: "dc"
        }]
      })
    });
    dcs.push(dc2);
    await dc2.open();

    await new Promise(resolve => {
      setTimeout(() => resolve(), 200);
    });

    assert.equal(dc1.getIncommingPeers(), 1);
    assert.equal(dc1.getOutgoingPeers(), 1);
    assert.equal(dc2.getIncommingPeers(), 1);
    assert.equal(dc2.getOutgoingPeers(), 1);

    await dc1.put("my-key", "my-value");
    assert.equal(await dc1.get("my-key"), "my-value");

    await new Promise(resolve => {
      setTimeout(() => resolve(), 200);
    });
    assert.equal(await dc2.get("my-key"), "my-value");
  }).timeout(3000);
});