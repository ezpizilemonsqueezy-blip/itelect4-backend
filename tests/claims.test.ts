import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock is hoisted above the imports, so the spies it uses must be hoisted too.
const { claimFind, itemFind } = vi.hoisted(() => ({
  claimFind: vi.fn(),
  itemFind: vi.fn(),
}));

// No MongoDB in tests: the connect middleware resolves at once and the models return canned data.
vi.mock("../src/config/db.js", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../src/models/Claim.js", () => ({
  ClaimModel: { find: claimFind },
}));
vi.mock("../src/models/Item.js", () => ({
  ItemModel: { find: itemFind },
}));

import app from "../src/app.js";

// CI provides JWT_SECRET as a repository secret; locally a throwaway value is fine.
process.env.JWT_SECRET ??= "local-test-secret";
const USER_ID = "6ae34f6278af4dd8e3d51858";

function tokenFor(userId: string, secret = process.env.JWT_SECRET as string): string {
  return jwt.sign({ userId }, secret, { expiresIn: "5m" });
}

describe("GET /", () => {
  it("identifies the backend and links to the health endpoint", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      name: "Itelect4 Backend API",
      status: "ok",
      health: "/api/health",
    });
  });
});

describe("GET /api/claims (behind requireAuth)", () => {
  beforeEach(() => {
    itemFind.mockReset().mockReturnValue({ distinct: vi.fn().mockResolvedValue([]) });
    claimFind.mockReset().mockReturnValue({ sort: vi.fn().mockResolvedValue([]) });
  });

  it("answers 401 'Authentication required' when no token is sent", async () => {
    const response = await request(app).get("/api/claims");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Authentication required" });
    expect(claimFind).not.toHaveBeenCalled();
  });

  it("answers 401 'Invalid or expired token' for a token signed with the wrong secret", async () => {
    const response = await request(app)
      .get("/api/claims")
      .set("Authorization", `Bearer ${tokenFor(USER_ID, "not-the-real-secret")}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Invalid or expired token" });
    expect(claimFind).not.toHaveBeenCalled();
  });

  it("lets a valid token past requireAuth and looks up that user's claims", async () => {
    const response = await request(app)
      .get("/api/claims")
      .set("Authorization", `Bearer ${tokenFor(USER_ID)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    // The userId inside the token reached the route handler.
    expect(itemFind).toHaveBeenCalledWith({ userId: USER_ID });
    expect(claimFind).toHaveBeenCalledWith({ $or: [{ userId: USER_ID }, { itemId: { $in: [] } }] });
  });
});
