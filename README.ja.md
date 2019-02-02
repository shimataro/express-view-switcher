# express-view-switcher

[![Release][image-release]][link-release]
[![Node.js version][image-engine]][link-engine]
[![License][image-license]][link-license]

リクエストごとにビューのルートディレクトリを切り替え

* [English](README.md)
* [日本語](README.ja.md)

## インストール

```bash
npm install -S express-view-switcher
```

## 使い方

### 1: マルチデバイス対応

```javascript
import viewSwitcher from "express-view-switcher";

const app = express();
app.set("view engine", "pug");
app.use(viewSwitcher((req) =>
{
    // "User-Agent" ヘッダを解析して検索したいディレクトリを列挙
    // 最初に見つかったビューを表示
    // 1. views/smartphone
    // 2. views/default
    return [["smartphone", "default"]];
}));

// あとは普通に res.render() をコール
```

### 2: 多言語対応

```javascript
app.use(viewSwitcher((req) =>
{
    // "Accept-Language" ヘッダやクエリストリングなどを解析
    // 1. views/en-us
    // 2. views/en
    // 3. views/ja
    return [["en-us", "en", "ja"]];
}));
```

### 3: 多言語＋マルチデバイス

```javascript
app.use(viewSwitcher((req) =>
{
    // 組み合わせてもOK
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

## ベースディレクトリを指定

```javascript
// 包含や継承をサポートしているテンプレートエンジンで、res.localsにベースディレクトリを指定できる場合は第2引数にキー名を指定する
app.use(viewSwitcher((req) =>
{
    return [["smartphone", "default"]];
}), "basedir"); // テンプレートエンジンにPugを使っている場合、自動的にres.localsにbasedirが追加されるのでこの指定は不要
```

## 実践的な例

```javascript
app.use(viewSwitcher((req) =>
{
    return [_getLanguageCandidates(req), _getDeviceCandidates(req)];
}));

/**
 * リクエストヘッダを取得
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
 * 言語候補を取得
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

    // 最後にデフォルトの言語を追加
    languageCandidates.push("en");
    return languageCandidates;
}

/**
 * デバイス候補を取得
 * @param {Object} req
 * @return {string[]}
 */
function _getDeviceCandidates(req)
{
    // UserAgentからデバイス情報を取得
    const userAgent = _getRequestHeader(req, "user-agent");
    return [_detectDevice(userAgent), "default"];

    /**
     * User-Agentからデバイスを検出
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

## ライセンス

MITライセンス

## 著作権

&copy; 2017 shimataro

[image-release]: https://img.shields.io/github/release/shimataro/maylily.svg
[link-release]: https://github.com/shimataro/maylily/releases
[image-engine]: https://img.shields.io/node/v/adjuster.svg
[link-engine]: https://nodejs.org/
[image-license]: https://img.shields.io/github/license/shimataro/maylily.svg
[link-license]: ./LICENSE
