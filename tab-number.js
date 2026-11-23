import { formatNumber } from "./number-format.js";

const VALID_PROTOCOLS = new Set(["https:", "http:"]);
// The Chrome Web Store, which extensions can’t script. `chrome.google.com` is the old domain, which is still used for
// the developer dashboard.
const INVALID_HOSTNAMES = new Set([
  "chromewebstore.google.com",
  "chrome.google.com",
]);

export function isValidUrl(urlString) {
  if (urlString === "") {
    return false;
  }

  const url = new URL(urlString);

  return (
    VALID_PROTOCOLS.has(url.protocol) && !INVALID_HOSTNAMES.has(url.hostname)
  );
}

// Number the tabs and return the tabs which can display their numbers, paired with their formatted numbers. Tabs in
// collapsed groups aren’t numbered. Tabs which can’t display their numbers are numbered but not returned so that the
// numbers of the other tabs don’t shift.
export function numberTabs(
  tabs,
  {
    collapsedTabGroupIds,
    useRelativeNumber,
    useRelativeNumberSign,
    numberFormat,
  },
) {
  const sortedTabs = tabs.toSorted((tab1, tab2) => tab1.index - tab2.index);
  const isVisible = (tab) => !collapsedTabGroupIds.has(tab.groupId);

  // Count the visible tabs before the active tab. This is the same as finding the active tab among the visible tabs as
  // long as the active tab is visible, which is always true because collapsing the group of the active tab activates
  // another tab. Counting among all tabs keeps the behavior before this logic was extracted from `background.js` in
  // case there is no visible active tab.
  let activeTabPosition = 0;

  for (const tab of sortedTabs) {
    if (tab.active) {
      break;
    }

    if (isVisible(tab)) {
      activeTabPosition++;
    }
  }

  return sortedTabs.filter(isVisible).flatMap((tab, position) => {
    if (!canDisplayNumber(tab)) {
      return [];
    }

    const formattedNumber =
      useRelativeNumber && !tab.active
        ? formattedRelativeNumber(position, {
            activeTabPosition,
            useRelativeNumberSign,
            numberFormat,
          })
        : formattedAbsoluteNumber(position, { numberFormat });

    return [{ tab, formattedNumber }];
  });
}

// `position` is the 0-based position of the tab among the visible tabs.
function formattedAbsoluteNumber(position, { numberFormat }) {
  const absoluteNumber = position + 1;

  return formatNumber(absoluteNumber, { format: numberFormat });
}

// `position` and `activeTabPosition` are 0-based positions among the visible tabs.
function formattedRelativeNumber(
  position,
  { activeTabPosition, useRelativeNumberSign, numberFormat },
) {
  const relativeNumber = position - activeTabPosition;
  let sign = "";

  if (useRelativeNumberSign) {
    sign = relativeNumber < 0 ? "-" : "+";
  }

  return formatNumber(Math.abs(relativeNumber), {
    format: numberFormat,
    sign,
  });
}

function canDisplayNumber(tab) {
  // Injecting into a tab which has never been loaded, e.g., a tab restored at startup, fails. The tab will be updated
  // when it is loaded because `chrome.tabs.onUpdated` fires then.
  return isValidUrl(tab.url) && tab.status !== "unloaded";
}
