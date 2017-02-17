NODE_ENV=production webpack && \
./node_modules/.bin/babili extension/content.js > extension/content.min.js && \
cp src/background/chrome.js extension/chrome.js
