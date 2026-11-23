const VALID_PROTOCOLS = new Set(["https:", "http:"]);
const INVALID_HOSTNAMES = new Set(["chrome.google.com"]);

export function isValidUrl(urlString) {
  if (urlString === "") {
    return false;
  }

  const url = new URL(urlString);

  return (
    VALID_PROTOCOLS.has(url.protocol) && !INVALID_HOSTNAMES.has(url.hostname)
  );
}
