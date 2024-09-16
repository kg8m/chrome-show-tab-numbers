const storage = {
  get: async (key) => (await chrome.storage.sync.get([key]))[key],
  set: async (config) => await chrome.storage.sync.set(config),
};

document.addEventListener("DOMContentLoaded", async () => {
  await restore();
  findRelativeNumberToggler().addEventListener("change", save);
  findRelativeNumberSignToggler().addEventListener("change", save);
});

async function restore() {
  const useRelativeNumber = await storage.get("useRelativeNumber");
  findRelativeNumberToggler().checked = useRelativeNumber ?? false;

  const useRelativeNumberSign = await storage.get("useRelativeNumberSign");
  findRelativeNumberSignToggler().checked = useRelativeNumberSign ?? false;
}

async function save(event) {
  if (event.target.id === "relative-number-toggler") {
    const useRelativeNumber = findRelativeNumberToggler().checked;
    await storage.set({ useRelativeNumber });
  }

  if (event.target.id === "relative-number-sign-toggler") {
    const useRelativeNumberSign = findRelativeNumberSignToggler().checked;
    await storage.set({ useRelativeNumberSign });
  }
}

function findRelativeNumberToggler() {
  return document.querySelector("#relative-number-toggler");
}

function findRelativeNumberSignToggler() {
  return document.querySelector("#relative-number-sign-toggler");
}
