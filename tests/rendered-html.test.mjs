import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("the site source contains Wanderlit product copy and the core actions", async () => {
  const [page, planner] = await Promise.all([
    readFile("app/page.tsx", "utf8"),
    readFile("app/TravelPlanner.tsx", "utf8"),
  ]);
  assert.match(page, /漫游签/);
  assert.match(planner, /足迹地图/);
  assert.match(planner, /生成.*条路线/);
  assert.match(planner, /导出长图/);
});
