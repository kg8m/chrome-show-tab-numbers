import globals from "globals";
import js from "@eslint/js";

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        ...globals.webextensions,
      },
    },
    ...js.configs.recommended,
  },
];
