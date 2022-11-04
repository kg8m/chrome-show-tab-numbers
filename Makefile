package_name := chrome-show-tab-numbers
package_targets := manifest.json background.js assets/icon128.png

EXTRACT_VERSION := jq --raw-output .version

.PHONY: lint
lint:
	npm run lint

.PHONY: fix
fix:
	npm run fix

.PHONY: update-version
update-version:
	$${EDITOR} ./manifest.json ./package.json
	[ "$$(cat manifest.json | ${EXTRACT_VERSION})" = "$$(cat package.json | ${EXTRACT_VERSION})" ] || \
		(echo "ERROR - version mismatch in manifest.json and package.json" && exit 1)
	git commit --message "Bump up version"
	git tag "v$$(cat manifest.json | ${EXTRACT_VERSION})"
	npm install
	git push --tags

.PHONY: zip
zip:
	rm -f packages/$(package_name).zip
	zip packages/$(package_name) $(package_targets)
	open packages
