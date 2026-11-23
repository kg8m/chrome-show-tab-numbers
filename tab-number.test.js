import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isValidUrl, numberTabs } from "./tab-number.js";

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

  it("rejects the Chrome Web Store and its developer dashboard", () => {
    assert.equal(
      isValidUrl("https://chromewebstore.google.com/category/extensions"),
      false,
    );
    assert.equal(
      isValidUrl("https://chrome.google.com/webstore/devconsole"),
      false,
    );
  });
});

describe("numberTabs", () => {
  const COLLAPSED_GROUP_ID = 1;
  const EXPANDED_GROUP_ID = 2;
  const NO_GROUP_ID = -1;

  // Build tabs in order from attributes, e.g., `[{}, { active: true }]`.
  function buildTabs(attributesList) {
    return attributesList.map((attributes, index) => ({
      id: index + 100,
      index,
      groupId: NO_GROUP_ID,
      url: "https://example.com/",
      status: "complete",
      active: false,
      ...attributes,
    }));
  }

  // Return pairs of a tab ID and a formatted number to compare them easily.
  function number(tabs, options = {}) {
    return numberTabs(tabs, {
      collapsedTabGroupIds: new Set([COLLAPSED_GROUP_ID]),
      useRelativeNumber: false,
      useRelativeNumberSign: false,
      numberFormat: "plain",
      ...options,
    }).map(({ tab, formattedNumber }) => [tab.id, formattedNumber]);
  }

  describe("with absolute numbers", () => {
    it("numbers tabs from 1", () => {
      const tabs = buildTabs([{}, { active: true }, {}]);

      assert.deepEqual(number(tabs), [
        [100, "1."],
        [101, "2."],
        [102, "3."],
      ]);
    });
  });

  describe("with relative numbers", () => {
    it("numbers the active tab with its absolute number and the other tabs with the distances", () => {
      const tabs = buildTabs([{}, {}, { active: true }, {}]);

      assert.deepEqual(number(tabs, { useRelativeNumber: true }), [
        [100, "2."],
        [101, "1."],
        [102, "3."],
        [103, "1."],
      ]);
    });

    it("prepends signs if enabled", () => {
      const tabs = buildTabs([{}, {}, { active: true }, {}]);

      assert.deepEqual(
        number(tabs, { useRelativeNumber: true, useRelativeNumberSign: true }),
        [
          [100, "-2."],
          [101, "-1."],
          [102, "3."],
          [103, "+1."],
        ],
      );
    });

    it("numbers tabs if the first tab is active", () => {
      const tabs = buildTabs([{ active: true }, {}, {}]);

      assert.deepEqual(
        number(tabs, { useRelativeNumber: true, useRelativeNumberSign: true }),
        [
          [100, "1."],
          [101, "+1."],
          [102, "+2."],
        ],
      );
    });

    it("numbers tabs if the last tab is active", () => {
      const tabs = buildTabs([{}, {}, { active: true }]);

      assert.deepEqual(
        number(tabs, { useRelativeNumber: true, useRelativeNumberSign: true }),
        [
          [100, "-2."],
          [101, "-1."],
          [102, "3."],
        ],
      );
    });
  });

  it("numbers tabs in the order of their indexes without changing the given array", () => {
    const tabs = buildTabs([{}, {}, {}]).reverse();
    const originalTabs = [...tabs];

    assert.deepEqual(number(tabs), [
      [100, "1."],
      [101, "2."],
      [102, "3."],
    ]);
    assert.deepEqual(tabs, originalTabs);
  });

  it("doesn’t number tabs in collapsed groups", () => {
    const tabs = buildTabs([
      {},
      { groupId: COLLAPSED_GROUP_ID },
      { groupId: EXPANDED_GROUP_ID },
      { active: true },
      { groupId: COLLAPSED_GROUP_ID },
      {},
    ]);

    assert.deepEqual(number(tabs), [
      [100, "1."],
      [102, "2."],
      [103, "3."],
      [105, "4."],
    ]);
    assert.deepEqual(
      number(tabs, { useRelativeNumber: true, useRelativeNumberSign: true }),
      [
        [100, "-2."],
        [102, "-1."],
        [103, "3."],
        [105, "+1."],
      ],
    );
  });

  it("numbers but doesn’t return tabs which can’t display their numbers", () => {
    const tabs = buildTabs([
      {},
      { url: "chrome://extensions/" },
      { active: true },
      { status: "unloaded" },
      {},
    ]);

    assert.deepEqual(number(tabs), [
      [100, "1."],
      [102, "3."],
      [104, "5."],
    ]);
    assert.deepEqual(
      number(tabs, { useRelativeNumber: true, useRelativeNumberSign: true }),
      [
        [100, "-2."],
        [102, "3."],
        [104, "+2."],
      ],
    );
  });

  it("formats numbers in the given format", () => {
    const tabs = buildTabs([{}, { active: true }, {}]);

    assert.deepEqual(number(tabs, { numberFormat: "circled" }), [
      [100, "①"],
      [101, "②"],
      [102, "③"],
    ]);
    assert.deepEqual(
      number(tabs, {
        numberFormat: "circled",
        useRelativeNumber: true,
        useRelativeNumberSign: true,
      }),
      [
        [100, "-①"],
        [101, "②"],
        [102, "+①"],
      ],
    );
  });
});
