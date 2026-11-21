import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  NOTIFICATION_COUNT_PATTERN,
  NUMBERED_PATTERN,
  NUMBER_FORMATS,
  formatNumber,
} from "./number-format.js";

// The same way as `updateOne()` in `background.js` removes a number from a title.
function removeNumber(title) {
  return title
    .replace(NUMBERED_PATTERN, "")
    .replace(NOTIFICATION_COUNT_PATTERN, "$1 ");
}

describe("formatNumber", () => {
  it("formats numbers in the plain format", () => {
    assert.equal(formatNumber(1, { format: "plain" }), "1.");
    assert.equal(formatNumber(9, { format: "plain" }), "9.");
    assert.equal(formatNumber(10, { format: "plain" }), "10.");
  });

  it("formats 1 to 9 as symbols in each format", () => {
    assert.equal(formatNumber(1, { format: "keycap" }), "1\uFE0F\u20E3");
    assert.equal(formatNumber(9, { format: "keycap" }), "9\uFE0F\u20E3");
    assert.equal(formatNumber(1, { format: "circled" }), "①");
    assert.equal(formatNumber(9, { format: "circled" }), "⑨");
    assert.equal(formatNumber(1, { format: "negativeCircled" }), "❶");
    assert.equal(formatNumber(9, { format: "negativeCircled" }), "❾");
    assert.equal(formatNumber(1, { format: "doubleStruck" }), "𝟙");
    assert.equal(formatNumber(9, { format: "doubleStruck" }), "𝟡");
    assert.equal(formatNumber(1, { format: "romanUpper" }), "Ⅰ");
    assert.equal(formatNumber(9, { format: "romanUpper" }), "Ⅸ");
    assert.equal(formatNumber(1, { format: "romanLower" }), "ⅰ");
    assert.equal(formatNumber(9, { format: "romanLower" }), "ⅸ");
    assert.equal(formatNumber(1, { format: "circledIdeograph" }), "㊀");
    assert.equal(formatNumber(9, { format: "circledIdeograph" }), "㊈");
  });

  it("formats 10 or more in the same way as the plain format", () => {
    for (const format of Object.keys(NUMBER_FORMATS)) {
      assert.equal(formatNumber(10, { format }), "10.", format);
      assert.equal(formatNumber(123, { format }), "123.", format);
    }
  });

  it("prepends a sign", () => {
    assert.equal(formatNumber(1, { format: "plain", sign: "-" }), "-1.");
    assert.equal(formatNumber(1, { format: "plain", sign: "+" }), "+1.");
    assert.equal(formatNumber(1, { format: "circled", sign: "-" }), "-①");
    assert.equal(formatNumber(1, { format: "circled", sign: "+" }), "+①");
    assert.equal(formatNumber(10, { format: "circled", sign: "-" }), "-10.");
    assert.equal(formatNumber(10, { format: "circled", sign: "+" }), "+10.");
  });

  it("falls back to the plain format", () => {
    assert.equal(formatNumber(1), "1.");
    assert.equal(formatNumber(1, { format: "unknown" }), "1.");
  });
});

describe("NUMBERED_PATTERN and NOTIFICATION_COUNT_PATTERN", () => {
  it("removes numbers in any format", () => {
    for (const format of Object.keys(NUMBER_FORMATS)) {
      for (const number of [1, 9, 10, 123]) {
        for (const sign of ["", "-", "+"]) {
          const numbered = formatNumber(number, { format, sign });
          assert.equal(
            removeNumber(`${numbered} Title`),
            "Title",
            `${format} ${sign}${number}`,
          );
        }
      }
    }
  });

  it("removes a plain number without a space", () => {
    assert.equal(removeNumber("1.Title"), "Title");
  });

  it("doesn’t remove a symbol without a space", () => {
    assert.equal(removeNumber("①Title"), "①Title");
  });

  it("doesn’t change a title without a number", () => {
    assert.equal(removeNumber("Title"), "Title");
    assert.equal(removeNumber("2026 Title"), "2026 Title");
  });

  it("removes a number after a notification count", () => {
    assert.equal(removeNumber("(1) 2. Title"), "(1) Title");
    assert.equal(removeNumber("(1) ② Title"), "(1) Title");
    assert.equal(removeNumber("(1) -② Title"), "(1) Title");
    assert.equal(removeNumber("(1) 2. (1) Title"), "(1) Title");
    assert.equal(removeNumber("(1) ② (1) Title"), "(1) Title");
  });

  it("doesn’t change a title with only a notification count", () => {
    assert.equal(removeNumber("(1) Title"), "(1) Title");
  });
});
