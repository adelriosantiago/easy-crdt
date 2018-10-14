var RText = require('./r-edit')
var reconnect = require('reconnect')
var reloader = require('client-reloader')

var rText = RTEXT = RText()

reconnect(reloader(function (stream) {
  stream.pipe(rText.createStream()).pipe(stream)
})).connect('/shoe')

//using the default template...
//document.body.appendChild(rText.widget())

let sampleTextArea = document.getElementById('sampleTextArea')
console.log('sampleTextArea', sampleTextArea)
rText.wrap(sampleTextArea)