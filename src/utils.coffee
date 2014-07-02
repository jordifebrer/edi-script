# The `utils` module are a group of unclassified utility structs and
# functions that will be moved soon into classes

exports = () ->

exports.separators =
  tab: '\t'
  space: ' '
  newLine: '\n'
  leftBrace: '{'
  rightBrace: '}'

exports.getArguments = ->
  process.argv

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

  if needs.td > 0 and (
      (token.type is 'open' and token.plainHtml is 'tr') or
      (token.type is 'close' and token.plainHtml is 'table')
    )
    needs.missing = ['td', 'tr']
    needs.td--
    needs.tr--

  if needs.tr > 0 and token.plainHtml is 'table'
    needs.missing = ['tr']
    needs.tr--

  needs

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

exports.setAssets = (name, flags, separators) ->
  out  = separators.tab +
    "<link rel=\"stylesheet\" type=\"text/css\" href=\"#{name}.css\"></link>" +
    separators.newLine
  if flags.angular
     out += separators.tab +
       "<script src=\"http://ajax.googleapis.com/ajax/libs/angularjs/1.2.19/angular.min.js\"></script>" +
       separators.newLine
  out += separators.tab + "<script src=\"#{name}.js\"></script>" + separators.newLine

exports.parseTag = (token, needs, spaces, tagIdent, flags, dict, separators) ->
  outObj =
    tagIdent: tagIdent
    needs: needs
    spaces: 0
    out: ''
    flags: flags

  switch token.type

    when 'open'
      tagIdent = tagIdent + exports.getIdent(token.plainKey)
      if (token.plainKey is 'scr' and token.attributes.attr.length == 0)
        outObj.flags.script = true
      else
        if needs.missing.length > 0
          tagIdent--
          for miss in needs.missing
            outObj.out += exports.getTag miss, token.attributes.attr, dict, false
        outObj.out += exports.getTag token.plainKey, token.attributes.attr, dict, true

      outObj.tagIdent = tagIdent
      outObj.needs = needs
      outObj.needs.missing = []

    when 'close'
      tagIdent = tagIdent - exports.getIdent(token.plainKey)
      if outObj.flags.script
        outObj.flags.script = false
      else
        if needs.missing.length > 0
          tagIdent--
          for miss in needs.missing
            outObj.out += exports.getTag miss, token.attributes.attr, dict, false
        outObj.out += exports.getTag token.plainKey, token.attributes.attr, dict, false

      outObj.tagIdent = tagIdent
      outObj.needs = needs
      outObj.needs.missing = []

    when 'text'
      outObj.out = separators.space
      if token.plainKey
        if spaces > 0
          outObj.out = separators.space + token.plainKey
        else
          outObj.spaces++
          outObj.out = token.plainKey

  if token.plainKey is 'htm'
    if /ng-app/.test token.attributes.attr
      outObj.flags.angular = true

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

  if '/bod' not in closeTagsArr
    out += "</body>" + separators.newLine
  if '/htm' not in closeTagsArr
    out += "</html>" + separators.newLine

  out

exports.repeat = (n, separators) ->
  Array(n).join separators.tab

module.exports = exports
