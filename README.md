# node-self-referenced-json

[![Build Status](https://travis-ci.org/strawhatboy/node-self-referenced-json.svg?branch=master)](https://travis-ci.org/strawhatboy/node-self-referenced-json)

Load self referenced json to object

- use $() to add a value reference
- use &() to add a real object reference
- use {{}} (mustache style) to add a reference as part of a string

## Example

myTemplate.json
```json
{
    "resources": {
        "const_int": 500,
        "some_title_string": "My APP",
        "size": {
            "height": 600, "width": 800
        }
    },
    "window": {
        "help_window": {
            "size": "$(resources.size)",
            "title": "$(resources.some_title_string)"
        }
    },
    "texts": {
        "warning": "windows size should be {{ resources['size'].width }}x{{ resources.size.height }}"
    }
}
```
myApp.js
```js
var SRJson = require('self-referenced-json');

var mySettings = SRJson.render(require('fs').readFileSync('myTemplate.json', 'utf-8'));
console.log(mySettings.texts['warning']);
```

## Option

```js
var SRJSON = require('self-referenced-json');
SRJson.render('some template here', {

    /*  
     * renderTimes {integer} default:1, times to render.
     *
     *     because the render order is from top to bottom,
     *     if there is a referenced reference which is not rendered yet, 
     *     try to put this value to something larger that 1
     */
    renderTimes: 10,

    /*
     * outputType {String} default:'object'
     *
     *    'object': return a JsonObject
     *    'string': return the serialized string of the object
     *              TAKE CARE!!! circular referenced object cannot be serialized.
     */
    outputType: 'object',

    /*
     * outputType {Object} default: the deserialized template itself
     *
     *    if you want to use other object as the view model, put it here
     */
    renderObj: someOtherObject
});
```
> Option can be `undefined`, all default values will be used.

## Syntax
### "$()"
```json
{
    "propA": { "propInsideA": 20 },
    "propB": "$(propA.propInsideA)"
}
```
returns
```js
{
    propA: { propInsideA: 20 },
    propB: 20
}
```


### "&()"
```json
{
    "propA": { "propInsideA": 20 },
    "propB": "&(propA)"
}
```
returns
```js
{
    propA: { propInsideA: 20 },
    propB: { propInsideA: 20 }  // if you change the propB.propInsideA, propA.propInsideA will also be changed.
}
```

> take care while using `&()` with a circular reference, the result could be unexpected.

### "{{}}"
same as mustache
```json
{
    "propA": 20,
    "propB": "the value is {{propA}}"
}
```
returns
```js
{
    propA: 20,
    propB: "the value is 20"
}
```

## Details
please check the source file `tests.js` for more details.