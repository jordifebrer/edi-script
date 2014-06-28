var Token, byline, coffee, dict, fs, utils;

fs = require('fs');

byline = require('byline');

coffee = require('coffee-script');

dict = require('../res/dict.json');

utils = require('./utils');

Token = require('./token');

exports.run = function() {
  var args, cssStr, cssStream, envs, htmlStr, htmlStream, jsStream, liveTagsArr, name, pathFile, scriptStr, stream, tokens;
  tokens = [];
  liveTagsArr = [];
  envs = {
    lineIdent: 0,
    tagIdent: 0,
    flags: {
      assets: false,
      script: false
    },
    needs: {
      td: 0,
      tr: 0,
      missing: []
    }
  };
  scriptStr = htmlStr = cssStr = '';
  args = utils.getArguments(process.argv);
  name = utils.getFilename(args);
  pathFile = utils.getPathFile(args);
  stream = byline(fs.createReadStream("" + pathFile));
  htmlStream = fs.createWriteStream("./" + name + ".html");
  jsStream = fs.createWriteStream("./" + name + ".js");
  cssStream = fs.createWriteStream("./" + name + ".css");
  stream.on('data', function(line) {
    var i, ident, lineArr, res, spaces, _i, _ref;
    line = line.toString();
    res = '';
    if (!envs.flags.assets) {
      if (line.trim() === '/hea' || line.trim() === '/bod') {
        htmlStr += utils.setAssets(name, utils.separators);
        envs.flags.assets = true;
      }
    }
    if (!(line.slice(0, 1) === '#' || line.slice(0, 2) === '//')) {
      spaces = 0;
      lineArr = line.split(utils.separators.space);
      for (i = _i = 0, _ref = lineArr.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        res += lineArr[i].replace(/(.*)/, function(s, key) {
          var parsedObj, token;
          token = new Token(key, liveTagsArr);
          cssStr += token.attributes.css;
          if (!token.isSpecial) {
            liveTagsArr = utils.registerTag(token.plainHtml, token.type, liveTagsArr);
            envs.needs = utils.autoCompleteHtml(token, envs.needs);
          }
          parsedObj = utils.parseTag(token.plainKey, token.type, token.attributes, envs.needs, spaces, envs.tagIdent, envs.flags, dict, utils.separators);
          envs.tagIdent = parsedObj.tagIdent;
          envs.needs = parsedObj.needs;
          envs.flags = parsedObj.flags;
          spaces = parsedObj.spaces;
          token.out = parsedObj.out;
          tokens.push(token);
          return token.out;
        });
      }
      if (res.trim()) {
        ident = res.slice(0, 2) === '</' ? envs.lineIdent - 1 : envs.lineIdent;
        if (envs.flags.script && (line !== 'scr')) {
          scriptStr += utils.preParseScr(res, dict.script) + utils.separators.newLine;
        } else {
          htmlStr += (utils.repeat(ident, utils.separators)) + res + utils.separators.newLine;
        }
      }
      return envs.lineIdent = envs.tagIdent;
    }
  });
  stream.on('end', function() {
    htmlStr += utils.setFinalHtml(tokens, utils.separators);
    htmlStream.write(htmlStr);
    jsStream.write(coffee.compile(scriptStr));
    return cssStream.write(cssStr);
  });
  return stream.on('error', function(error, code) {
    return console.log(error + ": " + code);
  });
};
