chrome.tabGroups.onCreated.addListener(requestToUpdateAll);
chrome.tabGroups.onMoved.addListener(requestToUpdateAll);
chrome.tabGroups.onRemoved.addListener(requestToUpdateAll);
chrome.tabGroups.onUpdated.addListener(requestToUpdateAll);
chrome.tabs.onCreated.addListener(requestToUpdateAll);
chrome.tabs.onMoved.addListener(requestToUpdateAll);
chrome.tabs.onRemoved.addListener(requestToUpdateAll);
chrome.tabs.onUpdated.addListener(requestToUpdateAll);

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
  const collapsedTabGroups = await chrome.tabGroups.query({ collapsed: true });
  const collapsedTabGroupIds = new Set(
    collapsedTabGroups.map((tabGroup) => tabGroup.id)
  );

  let indexAdjuster = 0;

  tabs.sort((tab1, tab2) => tab1.index - tab2.index);
  tabs.forEach((tab) => {
    if (collapsedTabGroupIds.has(tab.groupId)) {
      indexAdjuster--;
    }

    if (/^https?:\/\/(?!chrome\.google\.com)/.test(tab.url)) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: updateOne,
        args: [tab.index + 1 + indexAdjuster],
      });
    }
  });
}

function updateOne(number) {
  const cache = document.showTabNumbers ?? {};

  if (number === cache.number && document.title === cache.numberedTitle) {
    return;
  }

  const TITLE_PATTERN = /^\d+\. /;
  const unnumberedTitle = document.title.replace(TITLE_PATTERN, "");

  cache.number = number;
  document.title = cache.numberedTitle = `${number}. ${unnumberedTitle}`.trim();
  document.showTabNumbers = cache;
}
