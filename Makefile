name := chrome-show-tab-numbers
targets := manifest.json background.js

.PHONY: zip
zip:
	rm -f packages/$(name).zip
	zip packages/$(name) $(targets)
	open packages
