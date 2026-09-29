import { describe, expect, it } from "vitest";

import {
  assertAssetTransition,
  assertOwnerInvariant,
  assertPermission,
  assertSiteTransition,
  assertValidAssetParent,
  DomainRuleError,
  hasPermission,
  validateAssetImportRows,
  type AssetParentNode,
} from "../../src/index.js";

describe("Phase 1 lifecycle rules", () => {
  it("allows documented site and asset transitions and rejects reopening archives", () => {
    expect(() => assertSiteTransition("DRAFT", "ACTIVE")).not.toThrow();
    expect(() => assertAssetTransition("ACTIVE", "INACTIVE")).not.toThrow();
    expect(() => assertSiteTransition("ARCHIVED", "ACTIVE")).toThrowError(
      expect.objectContaining({ code: "SITE_INVALID_TRANSITION" }),
    );
  });

  it("preserves one active organization owner", () => {
    expect(() => assertOwnerInvariant(1, true)).toThrowError(
      expect.objectContaining({ code: "ORGANIZATION_REQUIRES_OWNER" }),
    );
  });
});

describe("Phase 1 authorization", () => {
  it("allows managers to maintain assets without granting membership administration", () => {
    expect(hasPermission("OPERATIONS_MANAGER", "assets:manage")).toBe(true);
    expect(hasPermission("OPERATIONS_MANAGER", "members:manage")).toBe(false);
    expect(() => assertPermission("VIEWER", "assets:manage")).toThrow(DomainRuleError);
  });
});

describe("asset hierarchy", () => {
  const nodes = new Map<string, AssetParentNode>([
    ["a", { id: "a", parentAssetId: null, organizationId: "org-1", siteId: "site-1" }],
    ["b", { id: "b", parentAssetId: "a", organizationId: "org-1", siteId: "site-1" }],
    ["c", { id: "c", parentAssetId: "b", organizationId: "org-1", siteId: "site-1" }],
    ["foreign", { id: "foreign", parentAssetId: null, organizationId: "org-2", siteId: "site-2" }],
  ]);

  it("rejects self-parenting, cycles, and cross-tenant parents", () => {
    expect(() => assertValidAssetParent(nodes.get("a")!, "a", nodes)).toThrowError(
      expect.objectContaining({ code: "ASSET_PARENT_SELF" }),
    );
    expect(() => assertValidAssetParent(nodes.get("a")!, "c", nodes)).toThrowError(
      expect.objectContaining({ code: "ASSET_PARENT_CYCLE" }),
    );
    expect(() => assertValidAssetParent(nodes.get("a")!, "foreign", nodes)).toThrowError(
      expect.objectContaining({ code: "ASSET_PARENT_SCOPE_MISMATCH" }),
    );
  });
});

describe("asset import validation", () => {
  it("reports row-safe coordinate and duplicate errors without partial mutation", () => {
    const issues = validateAssetImportRows([
      {
        rowNumber: 2,
        siteReference: "WEST",
        assetType: "Inverter",
        identifier: "INV-1",
        name: "A",
        latitude: 7,
      },
      {
        rowNumber: 3,
        siteReference: "WEST",
        assetType: "Inverter",
        identifier: " inv-1 ",
        name: "B",
        latitude: 91,
        longitude: 4,
      },
    ]);
    expect(issues.map(({ rowNumber, field, code }) => ({ rowNumber, field, code }))).toEqual([
      { rowNumber: 2, field: "longitude", code: "COORDINATE_PAIR_REQUIRED" },
      { rowNumber: 3, field: "identifier", code: "DUPLICATE_IN_FILE" },
      { rowNumber: 3, field: "latitude", code: "OUT_OF_RANGE" },
    ]);
  });
});
