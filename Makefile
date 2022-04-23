name := chrome-show-tab-numbers
targets := manifest.json background.js assets/icon128.png

.PHONY: zip
zip:
	rm -f packages/$(name).zip
	zip packages/$(name) $(targets)
	open packages
