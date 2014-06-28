# The `Token` class is the main class of the language. Represents 
# a tag of the original language and its functionality

dict = require '../res/dict.json'
utils = require './utils'

class Token
  constructor: (str, liveTagsArr) ->
    @ediStr = str
    @htmlStr = 'html'
    @plainKey = @_getPlainKey(str)
    @type = @_getType(@plainKey, dict)
    @plainHtml = @_getPlainHtml(@plainKey, @type, dict)
    @liveTagsArr = liveTagsArr
    @attributes = @_setAttributes(@ediStr, @liveTagsArr, dict, utils.separators)
    @isSpecial = @_getBehaviour(@plainKey)
    @out = ''

  _setAttributes: (ediStr, liveTagsArr, dict, separators) ->

    attributes =
      attr: []
      css: ''
    cssPropStr = ''

    if />/i.test(ediStr)
      tagArr = ediStr.split '>'
      ediStr = tagArr[0]
      tagArr = tagArr.splice(1)
    
      for i in [0...tagArr.length]
        attrArr = tagArr[i].split ':'
        if dict.attr[attrArr[0]]
          attributes.attr.push separators.space + dict.attr[attrArr[0]] + '="' + attrArr[1] + '"'
        if dict.css[attrArr[0]]
          cssPropStr += separators.newLine + separators.tab + dict.css[attrArr[0]] + ': ' + attrArr[1] + ';'

      if cssPropStr
        attributes.css += '' +
          liveTagsArr.join(separators.space) +
          separators.space +
          dict.html[ediStr] +
          separators.space +
          separators.leftBrace +
          cssPropStr +
          separators.newLine +
          separators.rightBrace +
          separators.newLine +
          separators.newLine

    attributes

  toString: () ->
    @ediStr + ' _ ' + @htmlStr

  _getPlainKey: (str) ->
    aux = str.split('>', 1).toString()

  _getType: (plainKey, dict) ->
    if dict.html[plainKey]
      'open'
    else if dict.html[plainKey.replace '/', '']
      'close'
    else
      'text'

  _getPlainHtml: (plainKey, type, dict) ->
    if type == 'open'
      dict.html[plainKey]
    else if type == 'close'
      dict.html[plainKey.replace '/', '']

  _getBehaviour: (str) ->
    if str == 'doc' then true else false


module.exports = Token