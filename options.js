import {
  DEFAULT_NUMBER_FORMAT,
  NUMBER_FORMATS,
  formatNumber,
} from "./number-format.js";

const storage = {
  get: async (key) => (await chrome.storage.sync.get([key]))[key],
  set: async (config) => await chrome.storage.sync.set(config),
};

const NUMBER_FORMAT_LABELS = {
  plain: "Plain",
  keycap: "Keycap emojis",
  circled: "Circled digits",
  negativeCircled: "Negative circled digits",
  doubleStruck: "Double-struck digits",
  romanUpper: "Roman numerals (uppercase)",
  romanLower: "Roman numerals (lowercase)",
  circledIdeograph: "Circled ideographs",
};

// Show examples like `① ② … ⑨ 10. 11. …` to illustrate that numbers between 2 and 9 are omitted and that 10 or more
// are formatted in the same way as the plain format. `null` represents omitted numbers.
const NUMBER_FORMAT_EXAMPLE_NUMBERS = [1, 2, null, 9, 10, 11, null];

document.addEventListener("DOMContentLoaded", async () => {
  appendNumberFormatFields();

  await restore();
  syncUi();

  findRelativeNumberToggler().addEventListener("change", save);
  findRelativeNumberToggler().addEventListener("change", syncUi);
  findRelativeNumberSignToggler().addEventListener("change", save);

  for (const radio of findNumberFormatRadios()) {
    radio.addEventListener("change", saveNumberFormat);
  }
});

function appendNumberFormatFields() {
  const container = findNumberFormatFieldsContainer();

  for (const format of Object.keys(NUMBER_FORMATS)) {
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "number-format";
    radio.value = format;

    const examples = NUMBER_FORMAT_EXAMPLE_NUMBERS.map((number) =>
      number === null ? "…" : formatNumber(number, { format }),
    ).join(" ");

    const nameElement = document.createElement("span");
    nameElement.textContent = NUMBER_FORMAT_LABELS[format];

    const examplesElement = document.createElement("span");
    examplesElement.textContent = examples;

    const label = document.createElement("label");
    label.append(radio, nameElement, examplesElement);

    container.append(label);
  }
}

async function restore() {
  const useRelativeNumber = await storage.get("useRelativeNumber");
  findRelativeNumberToggler().checked = useRelativeNumber ?? false;

  const useRelativeNumberSign = await storage.get("useRelativeNumberSign");
  findRelativeNumberSignToggler().checked = useRelativeNumberSign ?? false;

  const numberFormat = await storage.get("numberFormat");
  const radios = findNumberFormatRadios();
  const radio =
    radios.find((radio) => radio.value === numberFormat) ??
    radios.find((radio) => radio.value === DEFAULT_NUMBER_FORMAT);
  radio.checked = true;
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

async function saveNumberFormat(event) {
  await storage.set({ numberFormat: event.target.value });
}

function syncUi() {
  const relativeNumberToggler = findRelativeNumberToggler();
  const relativeNumberSignToggler = findRelativeNumberSignToggler();

  if (relativeNumberToggler.checked) {
    relativeNumberSignToggler.disabled = false;
    relativeNumberSignToggler.closest("label").ariaDisabled = false;
  } else {
    relativeNumberSignToggler.disabled = true;
    relativeNumberSignToggler.closest("label").ariaDisabled = true;
  }
}

function findRelativeNumberToggler() {
  return document.querySelector("#relative-number-toggler");
}

function findRelativeNumberSignToggler() {
  return document.querySelector("#relative-number-sign-toggler");
}

function findNumberFormatFieldsContainer() {
  return document.querySelector("#number-format-fields");
}

function findNumberFormatRadios() {
  return [...document.querySelectorAll('input[name="number-format"]')];
}
