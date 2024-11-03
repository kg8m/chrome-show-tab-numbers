[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![checks](https://github.com/kg8m/chrome-show-tab-numbers/actions/workflows/checks.yml/badge.svg)](https://github.com/kg8m/chrome-show-tab-numbers/actions/workflows/checks.yml)

# chrome-show-tab-numbers

A Chromium extension to show tab numbers.

![Screenshot](assets/screenshot.png)

Notable features:

- This extension supports Google Chrome’s collapsed tab group feature, automatically ignoring tabs in a collapsed tab group.
- You can toggle tab numbering for all tabs or just the current one via keyboard shortcuts or the extension’s context menu.
- Tab numbers can be relative, displaying the current tab’s absolute number and indicating the position of other tabs relative to it ― how many tabs they are ahead or behind the current one.

## How to Install

### From Chrome Web Store

https://chrome.google.com/webstore/detail/pflnpcinjbcfefgbejjfanemlgcfjbna

### From Source

1. Download (and unzip) this repository
1. Open the extensions of your browser
1. Enable “Developer mode”
1. Click “Load unpacked”
1. Select the downloaded directory

## How to Develop

1. Fork this repository
1. Clone your forked repository
1. Go to the cloned directory
1. (Create a branch)
1. Run `npm install`
1. Make changes to the source code
1. Lint the code: `make lint`
1. (Fix lint errors and rerun `make lint`)
1. Format the code: `make fix`
1. Create a pull request

## How to Release

1. Update the version: `make update-major`, `make update-minor`, or `make update-patch`
   - A new release and its release notes will be generated automatically. Review them on the [Releases](https://github.com/kg8m/chrome-show-tab-numbers/releases) page
1. Run `make zip` to build a zip file
1. Upload the built zip file to the [Chrome Web Store](https://chrome.google.com/webstore/devconsole) and publish it

## Q&amp;A

### Q. Keyboard shortcuts don’t work on Vivaldi; is this a bug in this extension?

A. No, it is Vivaldi’s bug. As a workaround, changing the shortcut to `Global` will solve the issue.

cf. https://forum.vivaldi.net/topic/75247/extensions-keyboard-shortcuts-don-t-work/115

> That is a known issue that can be fixed by changing the shortcut from `In Vivaldi` to `Global`.
>
> This can have some side effects if you use the same shortcut in other programs, so it might be helpful to also take a look at this workaround: [https://forum.vivaldi.net/topic/69541/guide-make-extension-keyboard-shortcuts-work-windows-10-11](https://forum.vivaldi.net/topic/69541/guide-make-extension-keyboard-shortcuts-work-windows-10-11)
