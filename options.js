const storage = {
  get: async (key) => (await chrome.storage.sync.get([key]))[key],
  set: async (config) => await chrome.storage.sync.set(config),
};

document.addEventListener("DOMContentLoaded", async () => {
  await restore();
  findRelativeNumberToggler().addEventListener("change", save);
});

async function restore() {
  const useRelativeNumber = await storage.get("useRelativeNumber");
  findRelativeNumberToggler().checked = useRelativeNumber ?? false;
}

async function save() {
  const useRelativeNumber = findRelativeNumberToggler().checked;
  await storage.set({ useRelativeNumber });
}

function findRelativeNumberToggler() {
  return document.querySelector("#relative-number-toggler");
}
