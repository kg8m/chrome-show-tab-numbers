const storage = {
  get: async (key) => (await chrome.storage.sync.get([key]))[key],
  set: async (config) => await chrome.storage.sync.set(config),
};

document.addEventListener("DOMContentLoaded", async () => {
  await restore();
  syncUi();

  findHideIndexesToggler().addEventListener("change", save);
  findHideIndexesToggler().addEventListener("change", syncUi);
  findRelativeNumberToggler().addEventListener("change", save);
  findRelativeNumberToggler().addEventListener("change", syncUi);
  findRelativeNumberSignToggler().addEventListener("change", save);
});

async function restore() {
  const hideIndexesLargerThan10 = await storage.get("hideIndexesLargerThan10");
  findHideIndexesToggler().checked = hideIndexesLargerThan10 ?? false;

  const useRelativeNumber = await storage.get("useRelativeNumber");
  findRelativeNumberToggler().checked = useRelativeNumber ?? false;

  const useRelativeNumberSign = await storage.get("useRelativeNumberSign");
  findRelativeNumberSignToggler().checked = useRelativeNumberSign ?? false;
}

async function save(event) {
  if (event.target.id === "hide-indexes-toggler") {
    const hideIndexesLargerThan10 = findHideIndexesToggler().checked;
    await storage.set({ hideIndexesLargerThan10 });
  }

  if (event.target.id === "relative-number-toggler") {
    const useRelativeNumber = findRelativeNumberToggler().checked;
    await storage.set({ useRelativeNumber });
  }

  if (event.target.id === "relative-number-sign-toggler") {
    const useRelativeNumberSign = findRelativeNumberSignToggler().checked;
    await storage.set({ useRelativeNumberSign });
  }
}

function syncUi() {
  const hideIndexesToggler = findHideIndexesToggler();
  const relativeNumberToggler = findRelativeNumberToggler();
  const relativeNumberSignToggler = findRelativeNumberSignToggler();

  if (hideIndexesToggler.checked) {
    relativeNumberToggler.disabled = true;
    relativeNumberToggler.closest("label").ariaDisabled = true;
  } else {
    relativeNumberToggler.disabled = false;
    relativeNumberToggler.closest("label").ariaDisabled = false;
  }

  if (relativeNumberToggler.checked) {
    hideIndexesToggler.disabled = true;
    hideIndexesToggler.closest("label").ariaDisabled = true;

    relativeNumberSignToggler.disabled = false;
    relativeNumberSignToggler.closest("label").ariaDisabled = false;
  } else {
    hideIndexesToggler.disabled = false;
    hideIndexesToggler.closest("label").ariaDisabled = false;

    relativeNumberSignToggler.disabled = true;
    relativeNumberSignToggler.closest("label").ariaDisabled = true;
  }
}

function findHideIndexesToggler() {
  return document.querySelector("#hide-indexes-toggler");
}

function findRelativeNumberToggler() {
  return document.querySelector("#relative-number-toggler");
}

function findRelativeNumberSignToggler() {
  return document.querySelector("#relative-number-sign-toggler");
}
