.DEFAULT_GOAL := help
HELP_SEPARATOR := ＠

PACKAGE_NAME := chrome-show-tab-numbers
PACKAGE_TARGETS := manifest.json background.js assets/icon128.png

.PHONY: help
help:  ## Show help
	@cat $(MAKEFILE_LIST) | \
		grep -E '^[-a-z]+:.*##' | \
		sed -e 's/:.*## /$(HELP_SEPARATOR)/' | \
		column -t -s $(HELP_SEPARATOR)

.PHONY: lint
lint:  ## Lint files
	npm run lint

.PHONY: fix
fix:  ## Format files
	npm run fix

.PHONY: update-major
update-major:  ## Update the major version
	scripts/update-version major

.PHONY: update-minor
update-minor:  ## Update the minor version
	scripts/update-version minor

.PHONY: update-patch
update-patch:  ## Update the patch version
	scripts/update-version patch

.PHONY: zip
zip:  ## Build a zip file for upload
	rm -f packages/$(PACKAGE_NAME).zip
	zip packages/$(PACKAGE_NAME) $(PACKAGE_TARGETS)
	open packages
