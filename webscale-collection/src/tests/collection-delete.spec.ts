import { Logger } from "@webscale/core";
import { assert } from "chai";
import { InMemoryConnection } from "../datasource";
import { SimpleDatasource } from "../datasource/simple.datasource";
import { CollectionEventType, CollectionFactory } from "../index";

const logger = Logger.create("@webscale/collection/test");

describe("@webscale/collection", () => {

  describe("Collection", () => {

    describe("#deleteItem", () => {

      it("Delete project", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });

        await connection.save(projects, {
          projectId: "my-project",
          owner: "Stevo"
        });

        let deleted = await projects.deleteItem({ query: { projectId: "my-project" } });
        assert.isTrue(deleted);
      });

      it("Delete missing project", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });

        let deleted = await projects.deleteItem({ query: { projectId: "my-project" } });
        assert.isFalse(deleted);
      });

      it("Delete without project id", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });

        await connection.save(projects, {
          projectId: "my-project",
          owner: "Stevo"
        });
        try {
          await projects.deleteItem({ query: {} });
          assert.fail();
        } catch (e) {
          if (e.message !== "Missing fields: projectId") {
            throw e;
          }
        }
      });

      it("Trigger delete event", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });

        await connection.save(projects, {
          projectId: "my-project",
          owner: "Stevo"
        });
        return new Promise((resolve, reject) => {
          projects.watch().forEach(event => {
            try {
              assert.deepEqual(event, {
                type: CollectionEventType.DELETED,
                after: undefined,
                before: {
                  projectId: "my-project",
                  owner: "Stevo"
                },
                collection: "projects",
                name: "my-project",
                ids: {
                  projectId: "my-project"
                }
              });
              resolve();
            } catch (e) {
              reject(e);
            }
          });

          projects.deleteItem({ query: { projectId: "my-project" } }).then(deleted => {
            if (!deleted) {
              throw new Error("Failed to delete 'my-project'");
            }
          }).catch(e => {
            reject(e);
          });
        });
      });

    });

  });

});
