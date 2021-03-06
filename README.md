# express-view-switcher

[![Build Status (Windows)][image-build-windows]][link-build-windows]
[![Build Status (macOS)][image-build-macos]][link-build-macos]
[![Build Status (Linux)][image-build-linux]][link-build-linux]
[![Syntax check][image-syntax-check]][link-syntax-check]
[![Release][image-release]][link-release]
[![Node.js version][image-engine]][link-engine]
[![Types][image-types]][link-types]
[![License][image-license]][link-license]

switch the view root directory per request

* [English](README.md)
* [日本語](README.ja.md)

## How to install

```bash
npm install -S express-view-switcher
```

## Usage

### 1: for multi-device support

```javascript
import viewSwitcher from "express-view-switcher";

const app = express();
app.set("view engine", "pug");
app.use(viewSwitcher((req) =>
{
    // enumerate the directories to be searched upon parsing "User-Agent" header
    // ...and the first view that is found will be rendered
    // 1. views/smartphone
    // 2. views/default
    return [["smartphone", "default"]];
}));

// ...then call res.render() as usual
```

### 2: for multi-language support

```javascript
app.use(viewSwitcher((req) =>
{
    // parses "Accept-Language" headers, query strings, etc.
    // 1. views/en-us
    // 2. views/en
    // 3. views/ja
    return [["en-us", "en", "ja"]];
}));
```

### 3: for both multi-device + multi-language support

```javascript
app.use(viewSwitcher((req) =>
{
    // can be combined!
    // 1. views/en-us/smartphone
    // 2. views/en-us/default
    // 3. views/en/smartphone
    // 4. views/en/default
    // 5. views/ja/smartphone
    // 6. views/ja/default
    return [
        ["en-us", "en", "ja"],
        ["smartphone", "default"],
    ];
}));
```

## specify root directory

```javascript
// if you're using a template engine that supports inclusion or inheritance, and can specify and set the base directory root key name in res.locals,
// you can set this root key by passing it as the second argument
app.use(viewSwitcher((req) =>
{
    return [["smartphone", "default"]];
}), "basedir"); // if using Pug as your template engine, there's no need to specify the root key name, as "basedir" is automatically set in res.locals
```

## Practical example

```javascript
app.use(viewSwitcher((req) =>
{
    return [getLanguageCandidates(req), getDeviceCandidates(req)];
}));

/**
 * get request header
 * @param {Object} req
 * @param {string} name
 * @param {int} maxLength
 * @return {string}
 */
function getRequestHeader(req, name, maxLength = 256)
{
    if(!req.headers.hasOwnProperty(name))
    {
        return "";
    }
    return req.headers[name].substr(0, maxLength);
}

/**
 * list up language candidates
 * @param {Object} req
 * @return {string[]}
 */
function getLanguageCandidates(req)
{
    const acceptLanguage = getRequestHeader(req, "accept-language");
    const languageCandidates = [];
    for(const language of acceptLanguage.split(","))
    {
        const parts = language.split(";");
        languageCandidates.push(parts[0]);
    }

    // finally, push the default language
    languageCandidates.push("en");
    return languageCandidates;
}

/**
 * list up device candidates
 * @param {Object} req
 * @return {string[]}
 */
function getDeviceCandidates(req)
{
    // get device info from UserAgent
    const userAgent = getRequestHeader(req, "user-agent");
    return [detectDevice(userAgent), "default"];
}

/**
 * detect device from UserAgent
 * @param {string} userAgent
 * @return {string}
 * @private
 */
function detectDevice(userAgent)
{
    if(userAgent.indexOf("iPhone") !== -1)
    {
        return "smartphone";
    }
    if(userAgent.indexOf("iPod touch") !== -1)
    {
        return "smartphone";
    }
    if(userAgent.indexOf("iPad") !== -1)
    {
        return "tablet";
    }
    if(userAgent.indexOf("Android") !== -1)
    {
        if(userAgent.indexOf("Mobile") !== -1)
        {
            return "smartphone";
        }
        else
        {
            return "tablet";
        }
    }
    return "default";
}
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

[image-build-windows]: https://github.com/shimataro/express-view-switcher/workflows/Windows/badge.svg
[link-build-windows]: https://github.com/shimataro/express-view-switcher
[image-build-macos]: https://github.com/shimataro/express-view-switcher/workflows/macOS/badge.svg
[link-build-macos]: https://github.com/shimataro/express-view-switcher
[image-build-linux]: https://github.com/shimataro/express-view-switcher/workflows/Linux/badge.svg
[link-build-linux]: https://github.com/shimataro/express-view-switcher
[image-syntax-check]: https://github.com/shimataro/express-view-switcher/workflows/Syntax%20check/badge.svg
[link-syntax-check]: https://github.com/shimataro/express-view-switcher
[image-release]: https://img.shields.io/github/release/shimataro/express-view-switcher.svg
[link-release]: https://github.com/shimataro/express-view-switcher/releases
[image-engine]: https://img.shields.io/node/v/express-view-switcher.svg
[link-engine]: https://nodejs.org/
[image-types]: https://img.shields.io/npm/types/express-view-switcher.svg
[link-types]: https://github.com/shimataro/express-view-switcher
[image-license]: https://img.shields.io/github/license/shimataro/express-view-switcher.svg
[link-license]: ./LICENSE
