express-view-switcher
===

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
    return [_getLanguageCandidates(req), _getDeviceCandidates(req)];
}));

/**
 * get request header
 * @param {Object} req
 * @param {string} name
 * @param {int} maxLength
 * @return {string}
 */
function _getRequestHeader(req, name, maxLength = 256)
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
function _getLanguageCandidates(req)
{
    const acceptLanguage = _getRequestHeader(req, "accept-language");
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
function _getDeviceCandidates(req)
{
    // get device info from UserAgent
    const userAgent = _getRequestHeader(req, "user-agent");
    return [_detectDevice(userAgent), "default"];

    /**
     * detect device from UserAgent
     * @param {string} userAgent
     * @return {string}
     * @private
     */
    function _detectDevice(userAgent)
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
}
```

## License
MIT License

## Copyright
&copy; 2017 shimataro
