(function() {
  var exports,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  exports = function() {};

  exports.getArguments = function() {
    return process.argv;
  };

  exports.separators = {
    tab: '\t',
    space: ' ',
    newLine: '\n',
    leftBrace: '{',
    rightBrace: '}'
  };

  exports.autoCompleteHtml = function(token, needs) {
    if (token.type === 'open' && token.plainHtml === 'td') {
      needs.td++;
    }
    if (token.type === 'close' && token.plainHtml === 'td') {
      needs.td--;
    }
    if (token.type === 'open' && token.plainHtml === 'tr') {
      needs.tr++;
    }
    if (token.type === 'close' && token.plainHtml === 'tr') {
      needs.tr--;
    }
    if (needs.td > 1 && token.type === 'open' && token.plainHtml === 'td') {
      needs.missing = ['td'];
      needs.td--;
    }
    if (needs.td > 0 && token.type === 'close' && token.plainHtml === 'tr') {
      needs.missing = ['td'];
      needs.td--;
    }
    if (needs.td > 0 && ((token.type === 'open' && token.plainHtml === 'tr') || (token.type === 'close' && token.plainHtml === 'table'))) {
      needs.missing = ['td', 'tr'];
      needs.td--;
      needs.tr--;
    }
    if (needs.tr > 0 && token.plainHtml === 'table') {
      needs.missing = ['tr'];
      needs.tr--;
    }
    return needs;
  };

  exports.getFilename = function(args) {
    var dirArr, filenameArr;
    if (/.edi/.test(args[2])) {
      dirArr = args[2].split('/');
      filenameArr = dirArr[dirArr.length - 1].split('.');
      return filenameArr[0];
    } else {
      console.error('Invalid number of arguments');
      return process.exit();
    }
  };

  exports.getPathFile = function(args) {
    if (/.edi/.test(args[2])) {
      return args[2];
    } else {
      console.error('Invalid number of arguments');
      return process.exit();
    }
  };

  exports.getIdent = function(key) {
    if (key === 'hr' || key === 'br' || key === 'doc') {
      return 0;
    } else {
      return 1;
    }
  };

  exports.getTag = function(key, attributes, dict, isOpenTag) {
    if (isOpenTag) {
      return '<' + dict.html[key] + attributes + '>';
    } else {
      return '</' + dict.html[key.replace('/', '')] + attributes + '>';
    }
  };

  exports.setAssets = function(name, flags, separators) {
    var out;
    out = separators.tab + ("<link rel=\"stylesheet\" type=\"text/css\" href=\"" + name + ".css\"></link>") + separators.newLine;
    if (flags.angular) {
      out += separators.tab + "<script src=\"http://ajax.googleapis.com/ajax/libs/angularjs/1.2.19/angular.min.js\"></script>" + separators.newLine;
    }
    return out += separators.tab + ("<script src=\"" + name + ".js\"></script>") + separators.newLine;
  };

  exports.parseTag = function(token, needs, spaces, tagIdent, flags, dict, separators) {
    var miss, outObj, _i, _j, _len, _len1, _ref, _ref1;
    outObj = {
      tagIdent: tagIdent,
      needs: needs,
      spaces: 0,
      out: '',
      flags: flags
    };
    switch (token.type) {
      case 'open':
        tagIdent = tagIdent + exports.getIdent(token.plainKey);
        if (token.plainKey === 'scr' && token.attributes.attr.length === 0) {
          outObj.flags.script = true;
        } else {
          if (needs.missing.length > 0) {
            tagIdent--;
            _ref = needs.missing;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              miss = _ref[_i];
              outObj.out += exports.getTag(miss, token.attributes.attr, dict, false);
            }
          }
          outObj.out += exports.getTag(token.plainKey, token.attributes.attr, dict, true);
        }
        outObj.tagIdent = tagIdent;
        outObj.needs = needs;
        outObj.needs.missing = [];
        break;
      case 'close':
        tagIdent = tagIdent - exports.getIdent(token.plainKey);
        if (outObj.flags.script) {
          outObj.flags.script = false;
        } else {
          if (needs.missing.length > 0) {
            tagIdent--;
            _ref1 = needs.missing;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              miss = _ref1[_j];
              outObj.out += exports.getTag(miss, token.attributes.attr, dict, false);
            }
          }
          outObj.out += exports.getTag(token.plainKey, token.attributes.attr, dict, false);
        }
        outObj.tagIdent = tagIdent;
        outObj.needs = needs;
        outObj.needs.missing = [];
        break;
      case 'text':
        outObj.out = separators.space;
        if (token.plainKey) {
          if (spaces > 0) {
            outObj.out = separators.space + token.plainKey;
          } else {
            outObj.spaces++;
            outObj.out = token.plainKey;
          }
        }
    }
    if (token.plainKey === 'htm') {
      if (/ng-app/.test(token.attributes.attr)) {
        outObj.flags.angular = true;
      }
    }
    return outObj;
  };

  exports.registerTag = function(tag, type, liveTagsArr) {
    if (type === 'open') {
      liveTagsArr.push(tag);
    } else if (type === 'close') {
      liveTagsArr.pop(tag);
    }
    return liveTagsArr;
  };

  exports.setFinalHtml = function(tokens, separators) {
    var closeTagsArr, out, token, _i, _len;
    out = '';
    closeTagsArr = [];
    for (_i = 0, _len = tokens.length; _i < _len; _i++) {
      token = tokens[_i];
      if (token.type === 'close') {
        closeTagsArr.push(token.plainKey);
      }
    }
    if (__indexOf.call(closeTagsArr, '/bod') < 0) {
      out += "</body>" + separators.newLine;
    }
    if (__indexOf.call(closeTagsArr, '/htm') < 0) {
      out += "</html>" + separators.newLine;
    }
    return out;
  };

  exports.repeat = function(n, separators) {
    return Array(n).join(separators.tab);
  };

  module.exports = exports;

}).call(this);
