import { CollectionEventType, CollectionFactory } from "../index";
import { InMemoryConnection } from "../datasource";
import { assert } from "chai";
import { Logger } from "@webscale/core";
import { SimpleDatasource } from "../datasource/simple.datasource";

const logger = Logger.create("@webscale/collection/test");

describe("@webscale/collection", () => {

  describe("Collection", () => {

    describe("#getItem", () => {

      it("Get one item", async () => {
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

        let result = await projects.getItem({ query: { projectId: "my-project" } });

        assert.deepEqual(result, {
          projectId: "my-project",
          owner: "Stevo"
        });
      });

      it("Get unknown item", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });

        let result = await projects.getItem({ query: { projectId: "my-project2" } });

        assert.isNull(result);
      });

      it("No filter", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });

        try {
          await projects.getItem({});
          assert.fail();
        } catch (e) {
          if (e.message !== "Missing fields: projectId") {
            throw e;
          }
        }
      });

      it("Unknown filter field", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project",
        });

        await connection.save(projects, {
          projectId: "my-project",
          owner: "Stevo"
        });

        let result = await projects.getItem({ query: { projectId: "my-project", myName: "true" } });

        assert.isNull(result);
      });

      it("Don't match second filter field", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project",
          datasource: new SimpleDatasource("test", new InMemoryConnection())
        });

        await connection.save(projects, {
          projectId: "my-project",
          owner: "Stevo"
        });

        let result = await projects.getItem({ query: { projectId: "my-project", owner: "Piet" } });

        assert.isNull(result);
      });

      it("Match second filter field", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project",
        });

        await connection.save(projects, {
          projectId: "my-project",
          owner: "Stevo"
        });

        let result = await projects.getItem({ query: { projectId: "my-project", owner: "Stevo" } });

        assert.deepEqual(result, {
          projectId: "my-project",
          owner: "Stevo"
        });
      });

      it("Find child item", async () => {
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
        let branches = factory.collection("branchs", {
          singularName: "branch",
          parent: "repos"
        });

        await connection.save(projects, {
          projectId: "my-project",
          owner: "Stevo"
        });
        await connection.save(repos, {
          projectId: "my-project",
          repoId: "my-repo"
        });
        await connection.save(branches, {
          projectId: "my-project",
          repoId: "my-repo",
          branchId: "master",
          isDefault: true
        });

        let result = await branches.getItem({
          query: {
            projectId: "my-project",
            repoId: "my-repo",
            branchId: "master"
          }
        });

        assert.deepEqual(result, {
          projectId: "my-project",
          repoId: "my-repo",
          branchId: "master",
          isDefault: true
        });
      });

      it("Cannot find child item", async () => {
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
        let branches = factory.collection("branchs", {
          singularName: "branch",
          parent: "repos"
        });

        await connection.save(projects, {
          projectId: "my-project",
          owner: "Stevo"
        });
        await connection.save(repos, {
          projectId: "my-project",
          repoId: "my-repo"
        });
        await connection.save(branches, {
          projectId: "my-project",
          repoId: "my-repo",
          branchId: "master",
          isDefault: true
        });

        let result = await branches.getItem({
          query: {
            projectId: "my-project",
            repoId: "my-repo2",
            branchId: "master"
          }
        });

        assert.isNull(result);
      });

      it("Get includes item", async () => {
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
        let branches = factory.collection("branchs", {
          singularName: "branch",
          parent: "repos"
        });

        await connection.save(projects, {
          projectId: "my-project",
          owner: "Stevo"
        });
        await connection.save(repos, {
          projectId: "my-project",
          repoId: "my-repo1"
        });
        await connection.save(repos, {
          projectId: "my-project",
          repoId: "my-repo2"
        });
        await connection.save(branches, {
          projectId: "my-project",
          repoId: "my-repo1",
          branchId: "master",
          isDefault: true
        });

        let result = await projects.getItem({
          query: {
            projectId: "my-project"
          },
          includes: ["repos"]
        });

        assert.deepEqual(result, {
          projectId: "my-project",
          owner: "Stevo",
          repos: [
            {
              projectId: "my-project",
              repoId: "my-repo1"
            }, {
              projectId: "my-project",
              repoId: "my-repo2"
            }]
        });
      });

      it("Get unknown includes item", async () => {
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
          await projects.getItem({
            query: {
              projectId: "my-project"
            },
            includes: ["repos"]
          });
          assert.fail();
        } catch (e) {
          if (e.message !== "Unknown collections to include: repos") {
            throw e;
          }
        }
      });

    });
  });
});
