import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { parseBody } from "next/dist/server/api-utils/node/parse-body";
import * as postsRoute from "../pages/api/posts";
import { MAX_POST_BODY_BYTES } from "../src/app/lib/postPayload";

vi.mock("../_api/_db", () => ({ connectToDatabase: vi.fn() }));
vi.mock("../server/lib/postNotifications", () => ({ isPostLive: vi.fn(), notifySubscribersAboutPost: vi.fn() }));

function request(body: string) {
    return Object.assign(Readable.from([Buffer.from(body)]), {
        headers: { "content-type": "application/json" },
    });
}

const limit = () => (postsRoute as any).config?.api?.bodyParser?.sizeLimit ?? "1mb";

describe("posts API request size", () => {
    it("accepts a post at the editor's maximum size", async () => {
        const content = "a".repeat(MAX_POST_BODY_BYTES - JSON.stringify({ content: "" }).length);
        const parsed = await parseBody(request(JSON.stringify({ content })) as any, limit());
        expect(parsed.content).toBe(content);
    });

    it("rejects requests above the configured limit", async () => {
        await expect(parseBody(request(JSON.stringify({ content: "a".repeat(MAX_POST_BODY_BYTES) })) as any, limit()))
            .rejects.toMatchObject({ statusCode: 413 });
    });
});
