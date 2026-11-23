import {
  NOTIFICATION_COUNT_PATTERN,
  NUMBERED_PATTERN,
  formatNumber,
} from "./number-format.js";
import { isValidUrl } from "./tab-number.js";

const storage = {
  get: async (key) => (await chrome.storage.sync.get([key]))[key],
};

// Store the toggle state in the session storage because the service worker is terminated when idle and its variables
// are reset. Tab IDs are valid only within a browser session, so the state doesn’t need to persist across sessions.
const toggleStateStorage = {
  get: async () => {
    const { enabled = true, disabledTabIds = [] } =
      await chrome.storage.session.get(["enabled", "disabledTabIds"]);

    return { enabled, disabledTabIds: new Set(disabledTabIds) };
  },

  // Serialize updates because each update reads, modifies, and writes the whole state asynchronously. Otherwise,
  // concurrent updates could overwrite each other’s changes.
  update: (modify) => {
    const result = toggleStateUpdateQueue.then(async () => {
      const toggleState = await toggleStateStorage.get();
      modify(toggleState);

      await chrome.storage.session.set({
        enabled: toggleState.enabled,
        disabledTabIds: [...toggleState.disabledTabIds],
      });
    });

    // Keep the queue alive even if an update fails.
    toggleStateUpdateQueue = result.catch(() => {});

    return result;
  },
};
let toggleStateUpdateQueue = Promise.resolve();

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

let timer = -1;

async function requestToUpdateAll() {
  const { enabled } = await toggleStateStorage.get();

  if (!enabled) {
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
  const useRelativeNumberSign = await storage.get("useRelativeNumberSign");
  const numberFormat = await storage.get("numberFormat");

  // Read the toggle state after all other asynchronous operations so that the update uses the latest state. Otherwise,
  // an update started before a toggle command could overwrite the result of the command.
  const toggleState = await toggleStateStorage.get();

  if (useRelativeNumber) {
    updateRelativeNumbers(tabs, {
      collapsedTabGroupIds,
      toggleState,
      useRelativeNumberSign,
      numberFormat,
    });
  } else {
    updateAbsoluteNumbers(tabs, {
      collapsedTabGroupIds,
      toggleState,
      numberFormat,
    });
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

function updateRelativeNumbers(
  tabs,
  { collapsedTabGroupIds, toggleState, useRelativeNumberSign, numberFormat },
) {
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

  let absoluteNumber = 1;

  for (const tab of tabs) {
    if (collapsedTabGroupIds.has(tab.groupId)) {
      continue;
    }

    if (isValidUrl(tab.url)) {
      if (tab.active) {
        const formattedNumber = formatNumber(absoluteNumber, {
          format: numberFormat,
        });
        requestToUpdateOne({ tab, formattedNumber, toggleState });
      } else {
        let sign = "";

        if (useRelativeNumberSign) {
          sign = relativeNumber < 0 ? "-" : "+";
        }

        const formattedNumber = formatNumber(Math.abs(relativeNumber), {
          format: numberFormat,
          sign,
        });
        requestToUpdateOne({ tab, formattedNumber, toggleState });
      }
    }

    absoluteNumber++;
    relativeNumber++;
  }
}

function updateAbsoluteNumbers(
  tabs,
  { collapsedTabGroupIds, toggleState, numberFormat },
) {
  let number = 1;

  for (const tab of tabs) {
    if (collapsedTabGroupIds.has(tab.groupId)) {
      continue;
    }

    if (isValidUrl(tab.url)) {
      const formattedNumber = formatNumber(number, { format: numberFormat });
      requestToUpdateOne({ tab, formattedNumber, toggleState });
    }

    number++;
  }
}

function requestToUpdateOne({ tab, formattedNumber, toggleState }) {
  // Injecting into a tab which has never been loaded, e.g., a tab restored at startup, fails. The tab will be updated
  // when it is loaded because `chrome.tabs.onUpdated` fires then.
  if (tab.status === "unloaded") {
    return;
  }

  const isEnabled =
    toggleState.enabled && !toggleState.disabledTabIds.has(tab.id);
  const tabName = tab.title;

  // Pass the patterns as strings because the injected function can’t import modules and its arguments must be
  // JSON-serializable.
  const patterns = {
    numbered: NUMBERED_PATTERN.source,
    notificationCount: NOTIFICATION_COUNT_PATTERN.source,
    flags: NUMBERED_PATTERN.flags,
  };

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: updateOne,
    args: [{ isEnabled, formattedNumber, tabName, patterns }],
  });
}

function updateOne({ isEnabled, formattedNumber, tabName, patterns }) {
  const cache = document.showTabNumbers ?? {};
  const isCacheAvailable =
    isEnabled === cache.enabled &&
    formattedNumber === cache.formattedNumber &&
    tabName === cache.numberedTitle;

  if (isCacheAvailable) {
    return;
  }

  const numberedPattern = new RegExp(patterns.numbered, patterns.flags);
  const notificationCountPattern = new RegExp(
    patterns.notificationCount,
    patterns.flags,
  );
  const unnumberedTitle = tabName
    .replace(numberedPattern, "")
    .replace(notificationCountPattern, "$1 ");

  cache.enabled = isEnabled;
  cache.formattedNumber = formattedNumber;
  cache.numberedTitle = (
    cache.enabled ? `${formattedNumber} ${unnumberedTitle}` : unnumberedTitle
  ).trim();

  document.title = cache.numberedTitle;
  document.showTabNumbers = cache;
}

async function toggleAllTabs() {
  await toggleStateStorage.update((toggleState) => {
    toggleState.enabled = !toggleState.enabled;
  });

  updateAll();
}

async function toggleCurrentTab() {
  const [currentTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  await toggleStateStorage.update((toggleState) => {
    const isDisabled = toggleState.disabledTabIds.has(currentTab.id);

    if (isDisabled) {
      toggleState.disabledTabIds.delete(currentTab.id);
    } else {
      toggleState.disabledTabIds.add(currentTab.id);
    }
  });

  updateAll();
}

async function onTabRemoved(tabId) {
  await toggleStateStorage.update((toggleState) => {
    toggleState.disabledTabIds.delete(tabId);
  });
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
