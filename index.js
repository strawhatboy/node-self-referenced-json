'use strict';

/*
*
* 
*
*/

var Mustache = require('mustache');
var _ = require('lodash');

var OUTPUT_TYPE = {
    OBJECT: 'object',
    STRING: 'string',
}

var TOKENS = {
    VALUE: '$',
    REFERENCE: '&',
    BRACKET_LEFT: '(',
    BRACKET_RIGHT: ')',
    BRACE_LEFT: '{',
    BRACE_RIGHT: '}'
}

module.exports = (function () {

    function SelfReferencedJson() {

        function parseLiteral(literal, obj) {
            var _literal = literal.trim();

            // split and remove empty 
            var keys = _.filter(_literal.split(/[\.\[\]\"\']/), function (l) { return l !== ''; });
            var resultObj = obj;

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];

                if (resultObj !== null && resultObj !== undefined && resultObj.hasOwnProperty(key)) {
                    resultObj = resultObj[key];
                } else {
                    // do nothing if the literal or object is invalid
                    return undefined;
                }
            }
            return keys.length > 0 ? resultObj : undefined;
        }

        function render_object(resultObj, renderObj) {
            for (var prop in resultObj) {
                if (resultObj.hasOwnProperty(prop)) {
                    var value = resultObj[prop];
                    if (typeof value === 'string') {
                        value = value.trim();
                        if (value.indexOf(TOKENS.VALUE + TOKENS.BRACKET_LEFT) === 0
                            && value.indexOf(TOKENS.BRACKET_RIGHT) === value.length - 1) {
                            // by value
                            var literalObj = parseLiteral(value.substring(2, value.length - 1), renderObj);
                            if (literalObj) {
                                if (typeof literalObj === 'object') {
                                    literalObj = _.merge({}, literalObj);
                                }
                                resultObj[prop] = literalObj;
                            }

                        } else if (value.indexOf(TOKENS.REFERENCE + TOKENS.BRACKET_LEFT) === 0
                            && value.indexOf(TOKENS.BRACKET_RIGHT) === value.length - 1) {
                            // by reference
                            var literalObj = parseLiteral(value.substring(2, value.length - 1), renderObj);
                            if (literalObj) {
                                resultObj[prop] = literalObj;
                            }

                        } else if (value.indexOf(TOKENS.BRACE_LEFT + TOKENS.BRACE_LEFT) !== -1
                            && value.indexOf(TOKENS.BRACE_RIGHT + TOKENS.BRACE_RIGHT) !== -1) {
                            // mustache style
                            var literal = '';
                            var braceIndex = value.indexOf(TOKENS.BRACE_LEFT + TOKENS.BRACE_LEFT);
                            var braceEnd = -2;
                            while (braceIndex !== -1) {
                                literal += value.slice(braceEnd + 2, braceIndex);
                                var rightPart = value.slice(braceIndex, value.length);
                                var end = rightPart.indexOf(TOKENS.BRACE_RIGHT + TOKENS.BRACE_RIGHT);
                                braceEnd = braceIndex + end;
                                if (end !== -1 && braceEnd > braceIndex) {
                                    var literalObj = parseLiteral(value.slice(braceIndex + 2, braceEnd), renderObj);
                                    if (literalObj) {
                                        literal += literalObj;
                                    } else {
                                        // keep the unkonwn property
                                        literal += value.slice(braceIndex, braceEnd + 2);
                                    }
                                    end = value.slice(braceIndex + 1, value.length).indexOf(TOKENS.BRACE_LEFT + TOKENS.BRACE_LEFT);
                                    if (end !== -1 && braceIndex + 1 + end < value.length) {
                                        braceIndex = braceIndex + 1 + end;
                                    } else {
                                        // add the string left
                                        literal += value.slice(braceEnd + 2, value.length);
                                        break;
                                    }
                                } else {
                                    literal += rightPart;
                                    break;
                                }
                            }

                            resultObj[prop] = literal;
                        }
                    } else if (typeof value === 'object')
                        render_object(value, renderObj);
                }
            }
        }

        /**
         * @param {String} jsonTemplate
         * @param {Object} options
         * 
         * @returns processed json string or object
         */
        this.render = function (jsonTemplate, options) {
            if (!(jsonTemplate !== undefined && jsonTemplate !== null && jsonTemplate !== '' && (typeof jsonTemplate) === 'string')) {
                return undefined;
            }

            var jsonObj = JSON.parse(jsonTemplate);

            var renderTimes = 1;
            var outputType = OUTPUT_TYPE.OBJECT;
            var renderObj = jsonObj;

            if (options) {
                renderTimes = options.renderTimes || renderTimes;
                outputType = options.outputType || outputType;
                renderObj = options.renderObj || renderObj;
            }

            var resultObj = jsonObj;
            for (var index = 0; index < renderTimes; index++) {
                render_object(resultObj, renderObj);
            }

            if (outputType === OUTPUT_TYPE.OBJECT) {
                return resultObj;
            } else if (outputType === OUTPUT_TYPE.STRING) {
                return JSON.stringify(resultObj);
            } else {
                return resultObj;
            }
        }
    }


    return new SelfReferencedJson();
})();