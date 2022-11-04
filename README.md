[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![lint](https://github.com/kg8m/chrome-show-tab-numbers/actions/workflows/lint.yml/badge.svg)](https://github.com/kg8m/chrome-show-tab-numbers/actions/workflows/lint.yml)

chrome-show-tab-numbers
==================================================

A Chromium extension to show tab numbers.

![Screenshot](assets/screenshot.png)

Notes:

* This extension supports Google Chrome's collapsed tab group feature. Tabs belonging to a collapsed tab group are ignored.
* If the current page is a PDF, this extension doesn't show a tab number because `document.title` returns `""` for a PDF document.

How to Install
--------------------------------------------------

### From Chrome Web Store

https://chrome.google.com/webstore/detail/pflnpcinjbcfefgbejjfanemlgcfjbna


### From Source

1. Download and unzip this repository
1. Open the extensions of your browser
1. Enable "Developer mode"
1. Click "Load unpacked"
1. Select the downloaded directory


How to Develop
--------------------------------------------------

1. Clone this repository
1. Go to the cloned directory
1. Execute `npm install`
1. Edit source codes
1. Execute `make lint`
1. (Fix lint errors and retry executing `make lint`)
1. Execute `make fix`
1. Create a pull request


How to Release
--------------------------------------------------

1. Update the version:
   1. Edit `manifeste.json` and `package.json`
   1. Execute `npm install` to update `package-lock.json`
1. Create a new tag: `git tag ...`
1. Push the changes
1. Execute `make zip`
1. Upload the zip file to Chrome Web Store
