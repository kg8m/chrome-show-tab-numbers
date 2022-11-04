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
	npm install
	git add --patch -- manifest.json package.json package-lock.json
	git commit --message "Bump up version"
	git tag "v$$(cat manifest.json | ${EXTRACT_VERSION})"
	git push --tags
	git push

.PHONY: zip
zip:
	rm -f packages/$(package_name).zip
	zip packages/$(package_name) $(package_targets)
	open packages
