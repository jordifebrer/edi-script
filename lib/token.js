(function() {
  var Token, dict, utils;

  dict = require('../res/dict.json');

  utils = require('./utils');

  Token = (function() {
    function Token(str, liveTagsArr) {
      this.ediStr = str;
      this.plainKey = this._getPlainKey(str);
      this.type = this._getType(this.plainKey, dict);
      this.plainHtml = this._getPlainHtml(this.plainKey, this.type, dict);
      this.liveTagsArr = liveTagsArr;
      this.attributes = this._setAttributes(this.ediStr, this.liveTagsArr, dict, utils.separators);
      this.isSpecial = this._getBehaviour(this.plainKey);
      this.out = '';
    }

    Token.prototype.toString = function() {
      return this.ediStr + ' => ' + this.plainHtml;
    };

    Token.prototype._setAttributes = function(ediStr, liveTagsArr, dict, separators) {
      var attrArr, attributes, cssPropStr, i, tagArr, _i, _ref;
      attributes = {
        attr: [],
        css: ''
      };
      cssPropStr = '';
      if (/>/i.test(ediStr)) {
        tagArr = ediStr.split('>');
        ediStr = tagArr[0];
        tagArr = tagArr.splice(1);
        for (i = _i = 0, _ref = tagArr.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          attrArr = tagArr[i].split(':');
          if (dict.attr[attrArr[0]]) {
            attributes.attr.push(separators.space + dict.attr[attrArr[0]] + "=\"" + (attrArr[1].replace(/\'/g, '')) + "\"");
          }
          if (dict.css[attrArr[0]]) {
            cssPropStr += separators.newLine + separators.tab + dict.css[attrArr[0]] + ': ' + attrArr[1] + ';';
          }
        }
        if (cssPropStr) {
          attributes.css += '' + liveTagsArr.join(separators.space) + separators.space + dict.html[ediStr] + separators.space + separators.leftBrace + cssPropStr + separators.newLine + separators.rightBrace + separators.newLine + separators.newLine;
        }
      }
      return attributes;
    };

    Token.prototype._getPlainKey = function(str) {
      return str.split('>', 1).toString();
    };

    Token.prototype._getType = function(plainKey, dict) {
      if (dict.html[plainKey]) {
        return 'open';
      } else if (dict.html[plainKey.replace('/', '')]) {
        return 'close';
      } else {
        return 'text';
      }
    };

    Token.prototype._getPlainHtml = function(plainKey, type, dict) {
      if (type === 'open') {
        return dict.html[plainKey];
      } else if (type === 'close') {
        return dict.html[plainKey.replace('/', '')];
      }
    };

    Token.prototype._getBehaviour = function(str) {
      if (str === 'doc') {
        return true;
      } else {
        return false;
      }
    };

    return Token;

  })();

  module.exports = Token;

}).call(this);
