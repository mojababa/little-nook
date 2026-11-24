import { describe, expect } from "vitest";

import { createWorkspace, test } from "@tests/integration/fixtures";

import { getWorkspace, renameWorkspace } from "./workspaces";

describe("renameWorkspace", () => {
  test("renames the workspace", async ({ ctx }) => {
    const result = await renameWorkspace(ctx, { name: "Cosy Corner" });

    expect(result).toEqual({ ok: true, value: undefined });
    expect(await getWorkspace(ctx)).toMatchObject({ name: "Cosy Corner" });
  });

  test("refuses a blank name and keeps the current one", async ({ ctx }) => {
    await renameWorkspace(ctx, { name: "Cosy Corner" });

    const result = await renameWorkspace(ctx, { name: "   " });

    expect(result).toEqual({ ok: false, error: "name-required" });
    expect(await getWorkspace(ctx)).toMatchObject({ name: "Cosy Corner" });
  });

  test("leaves other workspaces untouched", async ({ ctx }) => {
    const other = await createWorkspace({ name: "Someone else's nook" });

    await renameWorkspace(ctx, { name: "Cosy Corner" });

    expect(await getWorkspace(other)).toMatchObject({
      name: "Someone else's nook",
    });
  });
});
