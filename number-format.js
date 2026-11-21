// Symbols for the numbers 1 to 9 in each format. Numbers without a symbol, i.e., 10 or more, are formatted in the same
// way as the plain format.
export const NUMBER_FORMATS = {
  plain: [],

  // Append VARIATION SELECTOR-16 to display the keycaps as colored emojis.
  keycap: ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
    (digit) => `${digit}\uFE0F\u20E3`,
  ),

  circled: ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"],
  negativeCircled: ["❶", "❷", "❸", "❹", "❺", "❻", "❼", "❽", "❾"],
  doubleStruck: ["𝟙", "𝟚", "𝟛", "𝟜", "𝟝", "𝟞", "𝟟", "𝟠", "𝟡"],
  romanUpper: ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ"],
  romanLower: ["ⅰ", "ⅱ", "ⅲ", "ⅳ", "ⅴ", "ⅵ", "ⅶ", "ⅷ", "ⅸ"],
  circledIdeograph: ["㊀", "㊁", "㊂", "㊃", "㊄", "㊅", "㊆", "㊇", "㊈"],
};

export const DEFAULT_NUMBER_FORMAT = "plain";

// Format a positive number, e.g., `1.`, `①`, `-①`, or `+10.`. `sign` is an empty string, `+`, or `-`.
export function formatNumber(number, { format, sign = "" } = {}) {
  const symbols =
    NUMBER_FORMATS[format] ?? NUMBER_FORMATS[DEFAULT_NUMBER_FORMAT];
  const symbol = symbols[number - 1];

  return symbol ? `${sign}${symbol}` : `${sign}${number}.`;
}

const SYMBOLS_SOURCE = Object.values(NUMBER_FORMATS)
  .flat()
  .map((symbol) => symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

// Match a number in any format at the beginning of a title so that a number added in another format can be also
// removed. A space after a symbol is required to avoid removing a symbol which is a part of the original title. The end
// of a title is also accepted instead of a space because a numbered title without the original title, e.g., `①`, has no
// space after the symbol.
export const NUMBERED_PATTERN = new RegExp(
  `^[-+]?(?:\\d+\\. ?|(?:${SYMBOLS_SOURCE})(?: |$))`,
  "u",
);

// Match a number between a notification count and the original title, e.g., `(1) 2. Title`, which is caused by a page
// adding a notification count to the numbered title. A notification count added again by the page is also matched,
// e.g., `(1) 2. (1) Title`.
export const NOTIFICATION_COUNT_PATTERN = new RegExp(
  `^(\\(\\d+\\)) [-+]?(?:\\d+\\.|${SYMBOLS_SOURCE}) (?:\\(\\d+\\) )?`,
  "u",
);
