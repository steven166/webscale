import { CollectionEventType, CollectionFactory } from "../index";
import { InMemoryConnection } from "../datasource";
import { assert } from "chai";
import { Logger } from "@webscale/core";
import { toArray } from "rxjs/operators";
import { SimpleDatasource } from "../datasource/simple.datasource";

const logger = Logger.create("@webscale/collection/test");

describe("@webscale/collection", () => {

  describe("Collection", () => {

    describe("#getAll", () => {

      it("Get all items", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project"
        });

        await connection.save(projects, {
          projectId: "my-project1",
          owner: "Stevo"
        });
        await connection.save(projects, {
          projectId: "my-project2",
          owner: "Piet"
        });

        let result = await projects.getAll().pipe(toArray()).toPromise();

        assert.deepEqual(result, [
          {
            projectId: "my-project1",
            owner: "Stevo"
          }, {
            projectId: "my-project2",
            owner: "Piet"
          }]);
      });

      it("Get all filtered items", async () => {
        let factory = new CollectionFactory("");
        let connection = new InMemoryConnection();
        factory.datasource = new SimpleDatasource("test", connection);
        let projects = factory.collection("projects", {
          singularName: "project",
        });

        await connection.save(projects, {
          projectId: "my-project1",
          owner: "Stevo"
        });
        await connection.save(projects, {
          projectId: "my-project2",
          owner: "Klaas"
        });
        await connection.save(projects, {
          projectId: "my-project3",
          owner: "Klaas"
        });

        let result = await projects.getAll({ query: { owner: "Klaas" } }).pipe(toArray()).toPromise();

        assert.deepEqual(result, [
          {
            projectId: "my-project2",
            owner: "Klaas"
          },
          {
            projectId: "my-project3",
            owner: "Klaas"
          }]);
      });

      it("Get all sub items", async () => {
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

        await connection.save(projects, {
          projectId: "my-project",
          owner: "Stevo"
        });
        await connection.save(repos, {
          projectId: "my-project",
          repoId: "my-repo1",
          owner: "Klaas"
        });
        await connection.save(repos, {
          projectId: "my-project",
          repoId: "my-repo2",
          owner: "Klaas"
        });

        let result = await repos.getAll({ query: { projectId: "my-project" } }).pipe(toArray()).toPromise();

        assert.deepEqual(result, [
          {
            projectId: "my-project",
            repoId: "my-repo1",
            owner: "Klaas"
          },
          {
            projectId: "my-project",
            repoId: "my-repo2",
            owner: "Klaas"
          }]);
      });

      it("Get all sub items", async () => {
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

        await connection.save(projects, {
          projectId: "my-project",
          owner: "Stevo"
        });
        await connection.save(repos, {
          projectId: "my-project",
          repoId: "my-repo1",
          owner: "Klaas"
        });
        await connection.save(repos, {
          projectId: "my-project",
          repoId: "my-repo2",
          owner: "Klaas"
        });

        let result = await repos.getAll({ query: { projectId: "my-project" } }).pipe(toArray()).toPromise();

        assert.deepEqual(result, [
          {
            projectId: "my-project",
            repoId: "my-repo1",
            owner: "Klaas"
          },
          {
            projectId: "my-project",
            repoId: "my-repo2",
            owner: "Klaas"
          }]);
      });

    });
  });
});
