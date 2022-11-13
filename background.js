chrome.tabGroups.onCreated.addListener(requestToUpdateAll);
chrome.tabGroups.onMoved.addListener(requestToUpdateAll);
chrome.tabGroups.onRemoved.addListener(requestToUpdateAll);
chrome.tabGroups.onUpdated.addListener(requestToUpdateAll);
chrome.tabs.onCreated.addListener(requestToUpdateAll);
chrome.tabs.onMoved.addListener(requestToUpdateAll);
chrome.tabs.onRemoved.addListener(requestToUpdateAll);
chrome.tabs.onUpdated.addListener(requestToUpdateAll);

const VALID_PROTOCOLS = new Set(["https:", "http:"]);
const INVALID_HOSTNAMES = new Set(["chrome.google.com"]);
const INVALID_PATHNAME_PATTERN = /\.pdf$/;

let timer = -1;

function requestToUpdateAll() {
  clearTimeout(timer);
  timer = setTimeout(updateAll, 300);
}

async function updateAll() {
  const tabs = await chrome.tabs.query({
    currentWindow: true,
    discarded: false,
  });

  let collapsedTabGroups;
  try {
    collapsedTabGroups = await chrome.tabGroups.query({
      windowId: chrome.windows.WINDOW_ID_CURRENT,
      collapsed: true,
    });
  } catch (error) {
    if (error.message.includes("Grouping is not supported by tabs")) {
      return;
    }
  }

  const collapsedTabGroupIds = new Set(
    collapsedTabGroups.map((tabGroup) => tabGroup.id)
  );

  let indexAdjuster = 0;

  tabs.sort((tab1, tab2) => tab1.index - tab2.index);
  tabs.forEach((tab) => {
    if (collapsedTabGroupIds.has(tab.groupId)) {
      indexAdjuster--;
    }

    if (isValidUrl(tab.url)) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: updateOne,
        args: [tab.index + 1 + indexAdjuster],
      });
    }
  });
}

function isValidUrl(urlString) {
  if (urlString === "") {
    return false;
  }

  const url = new URL(urlString);

  return (
    VALID_PROTOCOLS.has(url.protocol) &&
    !INVALID_HOSTNAMES.has(url.hostname) &&
    !INVALID_PATHNAME_PATTERN.test(url.pathname)
  );
}

function updateOne(number) {
  const cache = document.showTabNumbers ?? {};

  if (number === cache.number && document.title === cache.numberedTitle) {
    return;
  }

  const NUMBERED_PATTERN = /^\d+\. ?/;
  const NOTIFICATION_COUNT_PATTERN = /^(\(\d+\)) \d+\. (?:\(\d+\) )?/;
  const unnumberedTitle = document.title
    .replace(NUMBERED_PATTERN, "")
    .replace(NOTIFICATION_COUNT_PATTERN, "$1 ");

  cache.number = number;
  cache.numberedTitle = `${number}. ${unnumberedTitle}`.trim();
  document.title = cache.numberedTitle;
  document.showTabNumbers = cache;
}
