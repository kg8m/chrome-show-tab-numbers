const config = { enabled: true, disabledTabIds: new Set() };

const storage = {
  get: async (key) => (await chrome.storage.sync.get([key]))[key],
};

const COMMANDS = {
  "toggle-all-tabs": toggleAllTabs,
  "toggle-current-tab": toggleCurrentTab,
};
const CONTEXT_MENU = {
  "chrome-show-tab-numbers-toggle-all-tabs": {
    title: "Toggle tab numbering for all tabs",
    callback: toggleAllTabs,
  },
  "chrome-show-tab-numbers-toggle-current-tab": {
    title: "Toggle tab numbering for current tab",
    callback: toggleCurrentTab,
  },
};

createContextMenu();

chrome.storage.onChanged.addListener(requestToUpdateAll);
chrome.tabGroups.onCreated.addListener(requestToUpdateAll);
chrome.tabGroups.onMoved.addListener(requestToUpdateAll);
chrome.tabGroups.onRemoved.addListener(requestToUpdateAll);
chrome.tabGroups.onUpdated.addListener(requestToUpdateAll);
chrome.tabs.onActivated.addListener(requestToUpdateAll);
chrome.tabs.onCreated.addListener(requestToUpdateAll);
chrome.tabs.onMoved.addListener(requestToUpdateAll);
chrome.tabs.onRemoved.addListener(requestToUpdateAll);
chrome.tabs.onUpdated.addListener(requestToUpdateAll);

chrome.tabs.onRemoved.addListener(onTabRemoved);
chrome.commands.onCommand.addListener(onCommand);
chrome.contextMenus.onClicked.addListener(onMenuClicked);

const VALID_PROTOCOLS = new Set(["https:", "http:"]);
const INVALID_HOSTNAMES = new Set(["chrome.google.com"]);

let timer = -1;

function requestToUpdateAll() {
  if (!config.enabled) {
    return;
  }

  clearTimeout(timer);
  timer = setTimeout(updateAll, 300);
}

async function updateAll() {
  const tabs = await chrome.tabs.query({ currentWindow: true });

  const collapsedTabGroups = await findCollapsedTabGroups();
  const collapsedTabGroupIds = new Set(
    collapsedTabGroups.map((tabGroup) => tabGroup.id),
  );

  tabs.sort((tab1, tab2) => tab1.index - tab2.index);

  const useRelativeNumber = await storage.get("useRelativeNumber");

  if (useRelativeNumber) {
    await updateRelativeNumbers(tabs, { collapsedTabGroupIds });
  } else {
    updateAbsoluteNumbers(tabs, { collapsedTabGroupIds });
  }
}

async function findCollapsedTabGroups() {
  try {
    return await chrome.tabGroups.query({
      windowId: chrome.windows.WINDOW_ID_CURRENT,
      collapsed: true,
    });
  } catch (error) {
    if (error.message.includes("Grouping is not supported by tabs")) {
      return [];
    }
  }
}

async function updateRelativeNumbers(tabs, { collapsedTabGroupIds }) {
  let relativeNumber = 0;

  for (const tab of tabs) {
    if (tab.active) {
      break;
    } else {
      if (!collapsedTabGroupIds.has(tab.groupId)) {
        relativeNumber--;
      }
    }
  }

  const useRelativeNumberSign = await storage.get("useRelativeNumberSign");
  let absoluteNumber = 1;

  for (const tab of tabs) {
    if (collapsedTabGroupIds.has(tab.groupId)) {
      continue;
    }

    if (isValidUrl(tab.url)) {
      if (tab.active) {
        requestToUpdateOne({ tab, number: absoluteNumber });
      } else {
        const number = useRelativeNumberSign
          ? `${relativeNumber < 0 ? "" : "+"}${relativeNumber}`
          : Math.abs(relativeNumber);
        requestToUpdateOne({ tab, number });
      }
    }

    absoluteNumber++;
    relativeNumber++;
  }
}

function updateAbsoluteNumbers(tabs, { collapsedTabGroupIds }) {
  let number = 1;

  for (const tab of tabs) {
    if (collapsedTabGroupIds.has(tab.groupId)) {
      continue;
    }

    if (isValidUrl(tab.url)) {
      requestToUpdateOne({ tab, number });
    }

    number++;
  }
}

function isValidUrl(urlString) {
  if (urlString === "") {
    return false;
  }

  const url = new URL(urlString);

  return (
    VALID_PROTOCOLS.has(url.protocol) &&
    !INVALID_HOSTNAMES.has(url.hostname)
  );
}

function requestToUpdateOne({ tab, number }) {
  const isEnabled = config.enabled && !config.disabledTabIds.has(tab.id);
  chrome.tabs.query({}, (tabs) => {
    const tabName = tabs.find(t => t.id === tab.id).title;
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: updateOne,
      args: [{ isEnabled, number, tabName }],
    });
  });
}

function updateOne({ isEnabled, number, tabName }) {
  const cache = document.showTabNumbers ?? {};
  const isCacheAvailable =
    isEnabled === cache.enabled &&
    number === cache.number &&
    tabName === cache.numberedTitle;

  if (isCacheAvailable) {
    return;
  }

  const NUMBERED_PATTERN = /^[-+]?\d+\. ?/;
  const NOTIFICATION_COUNT_PATTERN = /^(\(\d+\)) [-+]?\d+\. (?:\(\d+\) )?/;
  const unnumberedTitle = tabName
    .replace(NUMBERED_PATTERN, "")
    .replace(NOTIFICATION_COUNT_PATTERN, "$1 ");

  cache.enabled = isEnabled;
  cache.number = number;
  cache.numberedTitle = (
    cache.enabled ? `${number}. ${unnumberedTitle}` : unnumberedTitle
  ).trim();

  document.title = cache.numberedTitle;
  document.showTabNumbers = cache;
}

function toggleAllTabs() {
  config.enabled = !config.enabled;
  updateAll();
}

async function toggleCurrentTab() {
  const [currentTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  const isDisabled = config.disabledTabIds.has(currentTab.id);

  if (isDisabled) {
    config.disabledTabIds.delete(currentTab.id);
  } else {
    config.disabledTabIds.add(currentTab.id);
  }

  updateAll();
}

function onTabRemoved(tabId) {
  const isDisabled = config.disabledTabIds.has(tabId);

  if (isDisabled) {
    config.disabledTabIds.delete(tabId);
  }
}

function onCommand(command) {
  COMMANDS[command]();
}

function createContextMenu() {
  chrome.contextMenus.removeAll();
  for (const menuItemId in CONTEXT_MENU) {
    chrome.contextMenus.create({
      contexts: ["action"],
      id: menuItemId,
      title: CONTEXT_MENU[menuItemId].title,
    });
  }
}

function onMenuClicked(info) {
  CONTEXT_MENU[info.menuItemId].callback();
}
