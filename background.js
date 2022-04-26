chrome.tabs.onCreated.addListener(requestToUpdateAll);
chrome.tabs.onMoved.addListener(requestToUpdateAll);
chrome.tabs.onRemoved.addListener(requestToUpdateAll);
chrome.tabs.onUpdated.addListener(requestToUpdateAll);

let timer = -1;

function requestToUpdateAll() {
  clearTimeout(timer);
  timer = setTimeout(updateAll, 300);
}

function updateAll() {
  chrome.tabs.query({ currentWindow: true, discarded: false }, (tabs) => {
    tabs.forEach((tab) => {
      if (/^https?:\/\/(?!chrome\.google\.com)/.test(tab.url)) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: updateOne,
          args: [tab.index + 1],
        });
      }
    });
  });
}

function updateOne(number) {
  const cache = document.showTabNumbers ?? {};

  if (number === cache.number && document.title === cache.numberedTitle) {
    return;
  }

  cache.number = number;

  let unnumberedTitle;
  if ("isNumbered" in cache) {
    const TITLE_PATTERN = /^\d+\. /;
    unnumberedTitle = document.title.replace(TITLE_PATTERN, "");
  } else {
    cache.isNumbered = true;
    unnumberedTitle = document.title;
  }

  document.title = cache.numberedTitle = `${number}. ${unnumberedTitle}`;
  document.showTabNumbers = cache;
}
