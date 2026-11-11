import { describe, expect, it } from "vitest";
import { fileKeyFromUrl, replacedUrls } from "@/lib/upload-keys";

describe("fileKeyFromUrl", () => {
    it("reads the key from UploadThing URLs", () => {
        expect(fileKeyFromUrl("https://abc123.ufs.sh/f/2e0fdb64-9957_image.jpg")).toBe("2e0fdb64-9957_image.jpg");
        expect(fileKeyFromUrl("https://utfs.io/f/key%20with%20space.png")).toBe("key with space.png");
    });

    it("ignores anything that is not an UploadThing file", () => {
        expect(fileKeyFromUrl(null)).toBeNull();
        expect(fileKeyFromUrl("")).toBeNull();
        expect(fileKeyFromUrl("not a url")).toBeNull();
        expect(fileKeyFromUrl("https://example.com/f/key.jpg")).toBeNull();
        expect(fileKeyFromUrl("https://ufs.sh.evil.com/f/key.jpg")).toBeNull();
        expect(fileKeyFromUrl("http://abc.ufs.sh/f/key.jpg")).toBeNull();
        expect(fileKeyFromUrl("https://abc.ufs.sh/a/key.jpg")).toBeNull();
    });
});

describe("replacedUrls", () => {
    it("returns the previous image only when it changed", () => {
        expect(replacedUrls([["https://a.ufs.sh/f/old", "https://a.ufs.sh/f/new"]])).toEqual(["https://a.ufs.sh/f/old"]);
        expect(replacedUrls([["https://a.ufs.sh/f/old", null]])).toEqual(["https://a.ufs.sh/f/old"]);
        expect(replacedUrls([["https://a.ufs.sh/f/same", "https://a.ufs.sh/f/same"]])).toEqual([]);
        expect(replacedUrls([["https://a.ufs.sh/f/old", undefined]])).toEqual([]);
        expect(replacedUrls([[null, "https://a.ufs.sh/f/new"]])).toEqual([]);
    });
});
