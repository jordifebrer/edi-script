# The `utils` module are a group of unclassified utility structs and 
# functions that will be moved soon into classes

exports = () ->

exports.getArguments = ->
  process.argv

exports.separators =
  tab: '\t'
  space: ' '
  newLine: '\n'
  leftBrace: '{'
  rightBrace: '}'

exports.autoCompleteHtml = (token, needs) ->

  if token.type is 'open' and token.plainHtml is 'td'
    needs.td++
  if token.type is 'close' and token.plainHtml is 'td'
    needs.td--
  if token.type is 'open' and token.plainHtml is 'tr'
    needs.tr++
  if token.type is 'close' and token.plainHtml is 'tr'
    needs.tr--

  if needs.td > 1 and token.type is 'open' and token.plainHtml is 'td'
    needs.missing = ['td']
    needs.td--

  if needs.td > 0 and token.type is 'close' and token.plainHtml is 'tr'
    needs.missing = ['td']
    needs.td--

  if needs.td > 0 and ((token.type is 'open' and token.plainHtml is 'tr') or (token.type is 'close' and token.plainHtml is 'table'))
    needs.missing = ['td', 'tr']
    needs.td--
    needs.tr--

  if needs.tr > 0 and token.plainHtml is 'table' 
    needs.missing = ['tr']
    needs.tr--

  needs

exports.preParseScr = (str, dict) ->
  exports.preParseJs(exports.preParseCoffee(str, dict), dict)

exports.preParseCoffee = (str, dict) ->
    
  lineArr = str.split ' '
  res = ''
  for i in [0...lineArr.length]
    res += lineArr[i].replace /(.*)/, (s, key) ->
      unless dict[s] is `undefined`
        dict[s] + " "
      else
        key + " "
  res

exports.preParseJs = (str, dict) ->
    
  lineArr = str.split '('
  res = ''
  for i in [0...lineArr.length]
    res += lineArr[i].replace /(.*)/, (s, key) ->
      unless dict[s] is `undefined`
        dict[s] + " "
      else
        unless i == 0
          "(" + key
        else
          key
  res

exports.getFilename = (args) ->
  if /.edi/.test args[2]
    dirArr = args[2].split '/'
    filenameArr = dirArr[dirArr.length - 1].split '.'
    filenameArr[0]

  else
    console.error 'Invalid number of arguments'
    process.exit()

exports.getPathFile = (args) ->
  if /.edi/.test args[2]
    args[2]
  else
    console.error 'Invalid number of arguments'
    process.exit()

exports.getIdent = (key) ->
  if key in ['hr', 'br', 'doc'] then 0 else 1

exports.getTag = (key, attributes, dict, isOpenTag) ->
  if isOpenTag then '<' + dict.html[key] + attributes + '>' 
  else '</' + dict.html[key.replace '/',''] + attributes + '>'

exports.getTagAttributes = (key, liveTagsArr, dict, separators) ->
  attributes =
    attr: []
    css: ''
  cssPropStr = ''

  if />/i.test(key)
    tagArr = key.split '>'
    key = tagArr[0]
    tagArr = tagArr.splice(1)
  
    for i in [0...tagArr.length]
      attrArr = tagArr[i].split ':'
      unless dict.attr[attrArr[0]] is `undefined` 
        attributes.attr.push separators.space + dict.attr[attrArr[0]] + '="' + attrArr[1] + '"'
      unless dict.css[attrArr[0]] is `undefined`
        cssPropStr += separators.newLine + separators.tab + dict.css[attrArr[0]] + ': ' + attrArr[1] + ';'

    if cssPropStr
      attributes.css += liveTagsArr.join(' ') + ' ' + dict.html[key] + ' {' + cssPropStr + separators.newLine + '}' + separators.newLine + separators.newLine

  attributes

exports.setAssets = (name, separators) ->
  out  = separators.tab + "<link rel=\"stylesheet\" type=\"text/css\" href=\"css/#{name}.css\"></link>" + separators.newLine
  out += separators.tab + "<script src=\"js/#{name}.js\"></script>" + separators.newLine

exports.parseTag = (str, type, attributes, needs, spaces, tagIdent, flags, dict, separators) ->
  outObj =
    tagIdent: tagIdent
    needs: needs
    spaces: 0
    out: ''
    flags: flags

  switch type

    when 'open'
      tagIdent = tagIdent + exports.getIdent(str)
      if (str is 'scr' and attributes.attr.length == 0)
        outObj.flags.script = true
      else
        if needs.missing.length > 0
          tagIdent--
          for miss in needs.missing
            outObj.out += exports.getTag miss, attributes.attr, dict, false
        outObj.out += exports.getTag str, attributes.attr, dict, true

      outObj.tagIdent = tagIdent
      outObj.needs = needs
      outObj.needs.missing = []

    when 'close'
      tagIdent = tagIdent - exports.getIdent(str)
      if outObj.flags.script
        outObj.flags.script = false
      else
        if needs.missing.length > 0
          tagIdent--
          for miss in needs.missing
            outObj.out += exports.getTag miss, attributes.attr, dict, false
        outObj.out += exports.getTag str, attributes.attr, dict, false

      outObj.tagIdent = tagIdent
      outObj.needs = needs
      outObj.needs.missing = []


    when 'text'
      outObj.out = separators.space
      if str
        if spaces > 0
          outObj.out = separators.space + str
        else
          outObj.spaces++
          outObj.out = str

  outObj

exports.registerTag = (tag, type, liveTagsArr) ->
  if type == 'open'
    liveTagsArr.push tag
  else if type == 'close'
    liveTagsArr.pop tag

  liveTagsArr

exports.setFinalHtml = (tokens, separators) ->
  out = ''
  closeTagsArr = []
  
  for token in tokens
    if token.type is 'close'
      closeTagsArr.push token.plainKey

  if 'body' not in closeTagsArr
    out += "</body>" + separators.newLine
  if 'html' not in closeTagsArr
    out += "</html>" + separators.newLine

exports.repeat = (n, separators) ->
  Array(n).join separators.tab

module.exports = exports