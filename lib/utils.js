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

exports.preParseScr = function(str, dict) {
  return exports.preParseJs(exports.preParseCoffee(str, dict), dict);
};

exports.preParseCoffee = function(str, dict) {
  var i, lineArr, res, _i, _ref;
  lineArr = str.split(' ');
  res = '';
  for (i = _i = 0, _ref = lineArr.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    res += lineArr[i].replace(/(.*)/, function(s, key) {
      if (dict[s] !== undefined) {
        return dict[s] + " ";
      } else {
        return key + " ";
      }
    });
  }
  return res;
};

exports.preParseJs = function(str, dict) {
  var i, lineArr, res, _i, _ref;
  lineArr = str.split('(');
  res = '';
  for (i = _i = 0, _ref = lineArr.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    res += lineArr[i].replace(/(.*)/, function(s, key) {
      if (dict[s] !== undefined) {
        return dict[s] + " ";
      } else {
        if (i !== 0) {
          return "(" + key;
        } else {
          return key;
        }
      }
    });
  }
  return res;
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

exports.getTagAttributes = function(key, liveTagsArr, dict, separators) {
  var attrArr, attributes, cssPropStr, i, tagArr, _i, _ref;
  attributes = {
    attr: [],
    css: ''
  };
  cssPropStr = '';
  if (/>/i.test(key)) {
    tagArr = key.split('>');
    key = tagArr[0];
    tagArr = tagArr.splice(1);
    for (i = _i = 0, _ref = tagArr.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      attrArr = tagArr[i].split(':');
      if (dict.attr[attrArr[0]] !== undefined) {
        attributes.attr.push(separators.space + dict.attr[attrArr[0]] + '="' + attrArr[1] + '"');
      }
      if (dict.css[attrArr[0]] !== undefined) {
        cssPropStr += separators.newLine + separators.tab + dict.css[attrArr[0]] + ': ' + attrArr[1] + ';';
      }
    }
    if (cssPropStr) {
      attributes.css += liveTagsArr.join(' ') + ' ' + dict.html[key] + ' {' + cssPropStr + separators.newLine + '}' + separators.newLine + separators.newLine;
    }
  }
  return attributes;
};

exports.setAssets = function(name, separators) {
  var out;
  out = separators.tab + ("<link rel=\"stylesheet\" type=\"text/css\" href=\"css/" + name + ".css\"></link>") + separators.newLine;
  return out += separators.tab + ("<script src=\"js/" + name + ".js\"></script>") + separators.newLine;
};

exports.parseTag = function(str, type, attributes, needs, spaces, tagIdent, flags, dict, separators) {
  var miss, outObj, _i, _j, _len, _len1, _ref, _ref1;
  outObj = {
    tagIdent: tagIdent,
    needs: needs,
    spaces: 0,
    out: '',
    flags: flags
  };
  switch (type) {
    case 'open':
      tagIdent = tagIdent + exports.getIdent(str);
      if (str === 'scr' && attributes.attr.length === 0) {
        outObj.flags.script = true;
      } else {
        if (needs.missing.length > 0) {
          tagIdent--;
          _ref = needs.missing;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            miss = _ref[_i];
            outObj.out += exports.getTag(miss, attributes.attr, dict, false);
          }
        }
        outObj.out += exports.getTag(str, attributes.attr, dict, true);
      }
      outObj.tagIdent = tagIdent;
      outObj.needs = needs;
      outObj.needs.missing = [];
      break;
    case 'close':
      tagIdent = tagIdent - exports.getIdent(str);
      if (outObj.flags.script) {
        outObj.flags.script = false;
      } else {
        if (needs.missing.length > 0) {
          tagIdent--;
          _ref1 = needs.missing;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            miss = _ref1[_j];
            outObj.out += exports.getTag(miss, attributes.attr, dict, false);
          }
        }
        outObj.out += exports.getTag(str, attributes.attr, dict, false);
      }
      outObj.tagIdent = tagIdent;
      outObj.needs = needs;
      outObj.needs.missing = [];
      break;
    case 'text':
      outObj.out = separators.space;
      if (str) {
        if (spaces > 0) {
          outObj.out = separators.space + str;
        } else {
          outObj.spaces++;
          outObj.out = str;
        }
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
  if (__indexOf.call(closeTagsArr, 'body') < 0) {
    out += "</body>" + separators.newLine;
  }
  if (__indexOf.call(closeTagsArr, 'html') < 0) {
    return out += "</html>" + separators.newLine;
  }
};

exports.repeat = function(n, separators) {
  return Array(n).join(separators.tab);
};

module.exports = exports;
