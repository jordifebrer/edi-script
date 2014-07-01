# The `Edi` module is the start point of the 'compiler', some parts of
# this file should be moved to different classes

fs = require 'fs'
byline = require 'byline'
coffee = require 'coffee-script'
dict = require '../res/dict.json'
utils = require './utils'
Token = require './token'

exports.run = ->

  tokens = []
  liveTagsArr = []

  envs =
    lineIdent: 0
    tagIdent: 0
    flags:
      assets: false
      script: false
      angular: false
    needs:
      td: 0
      tr: 0
      missing: []

  scriptStr = htmlStr = cssStr = ''
  args = utils.getArguments process.argv
  name = utils.getFilename args
  pathFile = utils.getPathFile args

  stream = byline fs.createReadStream "#{pathFile}"
  htmlStream = fs.createWriteStream "./#{name}.html"
  jsStream = fs.createWriteStream "./#{name}.js"
  cssStream = fs.createWriteStream "./#{name}.css"

  stream.on 'data', (line) ->

    #loop line
    line = line.toString()
    res = ''

    if not envs.flags.assets
      if line.trim() is '/hea' or line.trim() is '/bod'
        htmlStr += utils.setAssets name, envs.flags, utils.separators
        envs.flags.assets = true

    # check for a comment line
    unless line[0...1] is '#' or line[0...2] is '//'
      
      spaces = 0
      lineArr = line.split utils.separators.space
      
      for i in [0...lineArr.length]

        res += lineArr[i].replace /(.*)/, (s, key) ->

          #loop token
          token = new Token(key, liveTagsArr)
          
          cssStr += token.attributes.css

          if not token.isSpecial
            liveTagsArr = utils.registerTag token.plainHtml, token.type, liveTagsArr
            envs.needs = utils.autoCompleteHtml(token, envs.needs)

          parsedObj = utils.parseTag token, envs.needs, spaces, envs.tagIdent,
            envs.flags, dict, utils.separators
          
          envs.tagIdent = parsedObj.tagIdent
          envs.needs = parsedObj.needs
          envs.flags = parsedObj.flags

          spaces = parsedObj.spaces

          token.out = parsedObj.out
          tokens.push(token)
          token.out

      if res.trim()
        ident = if res[0...2] is '</' then envs.lineIdent - 1 else envs.lineIdent
        if envs.flags.script and line not in ['scr']
          scriptStr += utils.preParseScr(res, dict.script) +
            utils.separators.newLine
        else
          htmlStr += (utils.repeat ident, utils.separators) +
            res + utils.separators.newLine

      envs.lineIdent = envs.tagIdent

  stream.on 'end', () ->
    htmlStr += utils.setFinalHtml tokens, utils.separators
    # html
    htmlStream.write htmlStr
    # js
    jsStream.write coffee.compile scriptStr
    # css
    cssStream.write cssStr

  stream.on 'error', (error, code) ->
    console.log error + ": " + code
