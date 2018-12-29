import { collection, CollectionEventType, CollectionFactory } from "../index";
import { InMemoryConnection } from "../datasource";
import { assert } from "chai";
import { Logger } from "@webscale/core";
import { SimpleDatasource } from "../datasource/simple.datasource";

const logger = Logger.create("@webscale/collection/test");

describe("@webscale/collection", () => {

  describe("Collection", () => {

    describe("#saveItem", () => {

      it("Save item", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project",
        });

        let result = await projects.saveItem({
          projectId: "my-project",
          owner: "Stevo"
        });

        assert.deepEqual(result, {
          projectId: "my-project",
          owner: "Stevo"
        });

        let actualResult = await connection.get(projects, { projectId: "my-project" });
        assert.deepEqual(actualResult, {
          projectId: "my-project",
          owner: "Stevo"
        });
      });

      it("Save multiple items", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });

        let result1 = await projects.saveItem({
          projectId: "my-project1",
          owner: "Stevo1"
        });
        let result2 = await projects.saveItem({
          projectId: "my-project2",
          owner: "Stevo2"
        });

        assert.deepEqual(result1, {
          projectId: "my-project1",
          owner: "Stevo1"
        });
        assert.deepEqual(result2, {
          projectId: "my-project2",
          owner: "Stevo2"
        });

        let actualResult1 = await connection.get(projects, { projectId: "my-project1" });
        let actualResult2 = await connection.get(projects, { projectId: "my-project2" });
        assert.deepEqual(actualResult1, {
          projectId: "my-project1",
          owner: "Stevo1"
        });
        assert.deepEqual(actualResult2, {
          projectId: "my-project2",
          owner: "Stevo2"
        });
      });

      it("Update item", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });

        let result1 = await projects.saveItem({
          projectId: "my-project",
          owner: "Stevo1"
        });
        let result2 = await projects.saveItem({
          projectId: "my-project",
          owner: "Stevo2"
        });

        assert.deepEqual(result1, {
          projectId: "my-project",
          owner: "Stevo1"
        });
        assert.deepEqual(result2, {
          projectId: "my-project",
          owner: "Stevo2"
        });

        let actualResult = await connection.get(projects, { projectId: "my-project" });
        assert.deepEqual(actualResult, {
          projectId: "my-project",
          owner: "Stevo2"
        });
      });

      it("Save item without id", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });

        try {
          await projects.saveItem({
            owner: "Stevo1"
          });
          assert.fail();
        } catch (e) {
          assert.equal(e.message, `project is invalid`);
          assert.equal(e.validationErrors.length, 1);
          assert.equal(e.validationErrors[0].message, `should have required property 'projectId'`);
        }
      });

      it("Save child item", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });
        let repos = factory.collection("repos", {
          singularName: "repo",
          parent: "projects"
        });

        let projectResult = await projects.saveItem({
          projectId: "my-project",
          owner: "Stevo1"
        });
        let repoResult = await repos.saveItem({
          projectId: "my-project",
          repoId: "my-repo",
          public: false
        });

        assert.deepEqual(projectResult, {
          projectId: "my-project",
          owner: "Stevo1"
        });
        assert.deepEqual(repoResult, {
          projectId: "my-project",
          repoId: "my-repo",
          public: false
        });

        let actualResult1 = await connection.get(projects, { projectId: "my-project" });
        let actualResult2 = await connection.get(repos, { projectId: "my-project", repoId: "my-repo" });
        assert.deepEqual(actualResult1, {
          projectId: "my-project",
          owner: "Stevo1"
        });
        assert.deepEqual(actualResult2, {
          projectId: "my-project",
          repoId: "my-repo",
          public: false
        });
      });

      it("Update child item", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });
        let repos = factory.collection("repos", {
          singularName: "repo",
          parent: "projects"
        });

        let projectResult = await projects.saveItem({
          projectId: "my-project",
          owner: "Stevo1"
        });
        let repoResult1 = await repos.saveItem({
          projectId: "my-project",
          repoId: "my-repo",
          public: false
        });
        let repoResult2 = await repos.saveItem({
          projectId: "my-project",
          repoId: "my-repo",
          public: true
        });

        assert.deepEqual(projectResult, {
          projectId: "my-project",
          owner: "Stevo1"
        });
        assert.deepEqual(repoResult1, {
          projectId: "my-project",
          repoId: "my-repo",
          public: false
        });
        assert.deepEqual(repoResult2, {
          projectId: "my-project",
          repoId: "my-repo",
          public: true
        });

        let actualResult1 = await connection.get(projects, { projectId: "my-project" });
        let actualResult2 = await connection.get(repos, { projectId: "my-project", repoId: "my-repo" });
        assert.deepEqual(actualResult1, {
          projectId: "my-project",
          owner: "Stevo1"
        });
        assert.deepEqual(actualResult2, {
          projectId: "my-project",
          repoId: "my-repo",
          public: true
        });
      });

      it("Update child item without id", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });
        let repos = factory.collection("repos", {
          singularName: "repo",
          parent: "projects"
        });

        await projects.saveItem({
          projectId: "my-project",
          owner: "Stevo1"
        });
        try {
          await repos.saveItem({
            projectId: "my-project",
            public: false
          });
          assert.fail();
        } catch (e) {
          assert.equal(e.message, "repo is invalid");
          assert.equal(e.validationErrors.length, 1);
          assert.equal(e.validationErrors[0].message, `should have required property 'repoId'`);
        }
      });

      it("Update child item without parent id", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });
        let repos = factory.collection("repos", {
          singularName: "repo",
          parent: "projects"
        });

        await projects.saveItem({
          projectId: "my-project",
          owner: "Stevo1"
        });
        try {
          await repos.saveItem({
            repoId: "my-repo",
            public: false
          });
          assert.fail();
        } catch (e) {
          if (e.message !== "Missing fields: projectId") {
            throw e;
          }
        }
      });

      it("Trigger create event", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });

        return new Promise((resolve, reject) => {
          projects.watch().forEach(event => {
            try {
              assert.deepEqual(event, {
                type: CollectionEventType.CREATED,
                before: undefined,
                after: {
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
              reject(e)
            }
          });

          projects.saveItem({
            projectId: "my-project",
            owner: "Stevo"
          }).catch(e => reject(e));
        });
      });

      it("Trigger update event", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });

        await projects.saveItem({
          projectId: "my-project",
          owner: "Stevo1"
        });

        return new Promise((resolve, reject) => {
          projects.watch().forEach(event => {
            try {
              assert.deepEqual(event, {
                type: CollectionEventType.UPDATED,
                before: {
                  projectId: "my-project",
                  owner: "Stevo1"
                },
                after: {
                  projectId: "my-project",
                  owner: "Stevo2"
                },
                collection: "projects",
                name: "my-project",
                ids: {
                  projectId: "my-project"
                }
              });
              resolve();
            } catch (e) {
              reject(e)
            }
          });

          projects.saveItem({
            projectId: "my-project",
            owner: "Stevo2"
          }).catch(e => reject(e));
        });
      });

    });

  });

});