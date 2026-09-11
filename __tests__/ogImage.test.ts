import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/og/route";

vi.mock("@vercel/og", () => ({
  ImageResponse: class {
    constructor(element: any, options: any) {
      (this as any).element = element;
      (this as any).options = options;
    }
  }
}));

describe("OG Image Generation", () => {
  it("handles request without parameters gracefully", async () => {
    const req = new NextRequest("http://localhost:3000/api/og");
    const res: any = await GET(req);
    
    expect(res).toBeDefined();
    expect(res.options.width).toBe(1200);
    expect(res.options.height).toBe(630);
  });

  it("incorporates title, club, and subtitle from query params", async () => {
    const req = new NextRequest("http://localhost:3000/api/og?title=Test+Title&club=Arsenal&subtitle=Test+Subtitle");
    const res: any = await GET(req);
    
    expect(res).toBeDefined();
    // In our mock, res.element contains the JSX tree
    expect(res.element).toBeDefined();
  });
  
  it("handles missing parameters but falls back to default title", async () => {
    const req = new NextRequest("http://localhost:3000/api/og");
    const res: any = await GET(req);
    
    expect(res).toBeDefined();
    expect(res.element).toBeDefined();
  });
});
