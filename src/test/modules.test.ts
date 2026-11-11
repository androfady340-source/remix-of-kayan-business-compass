import { describe, expect, it } from "vitest";
import { DEFAULT_MODULES, canEditData, canManageSettings } from "@/lib/modules";

describe("roles", () => {
  it("owner can manage settings, manager cannot", () => {
    expect(canManageSettings("owner")).toBe(true);
    expect(canManageSettings("manager")).toBe(false);
  });
  it("manager edits data, member does not", () => {
    expect(canEditData("manager")).toBe(true);
    expect(canEditData("member")).toBe(false);
  });
});

describe("business types", () => {
  it("shop pre-selects inventory", () => {
    expect(DEFAULT_MODULES.shop).toContain("inventory");
  });
});
