import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isValidUrl } from "./tab-number.js";

describe("isValidUrl", () => {
  it("accepts HTTP and HTTPS URLs", () => {
    assert.equal(isValidUrl("http://example.com/"), true);
    assert.equal(isValidUrl("https://example.com/path?query#hash"), true);
  });

  it("rejects URLs with other protocols", () => {
    assert.equal(isValidUrl("chrome://extensions/"), false);
    assert.equal(isValidUrl("chrome-extension://abcdefg/options.html"), false);
    assert.equal(isValidUrl("file:///path/to/file.html"), false);
    assert.equal(isValidUrl("about:blank"), false);
  });

  it("rejects an empty string", () => {
    assert.equal(isValidUrl(""), false);
  });

  it("rejects the Chrome Web Store", () => {
    assert.equal(isValidUrl("https://chrome.google.com/webstore/"), false);
  });
});
