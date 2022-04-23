package_name := chrome-show-tab-numbers
package_targets := manifest.json background.js assets/icon128.png

.PHONY: lint
lint:
	npm run lint

.PHONY: zip
zip:
	rm -f packages/$(package_name).zip
	zip packages/$(package_name) $(package_targets)
	open packages
