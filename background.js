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
      if (/^https?:\/\//.test(tab.url)) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: updateOne,
          args: [tab.index, tab.title],
        });
      }
    });
  });
}

function updateOne(index, title) {
  const TITLE_PATTERN = /^\d+\. /;
  const originalTitle = title.replace(TITLE_PATTERN, "");

  document.title = `${index + 1}. ${originalTitle}`;
}
