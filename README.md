# Twitter Video and Photo downloader.

## How to run

This app cannot crrently be uploaded to https://extensionworkshop.com/ because
manifest v3 isn't yet supported.

`yarn rollup` will build files necessary to run
`web-ext run -u <Twitter Page URL> --bc -s public"`

adding `-p <Profile Folder>` to the prior command with the "Profile Folder"
found at `about:support` (in FireFox). Ie
`"/Users/heezy/Library/Application Support/Firefox/Profiles/ua6xsl9k.default-release"`

full command example:
`web-ext run -u https://twitter.com/hkievet --bc -p "/Users/hkievet/Library/Application Support/Firefox/Profiles/jz24jmw9.bot" -s public`
