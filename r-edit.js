var diff = require('adiff').diff
var RArray = require('r-array')
var inherits = require('util').inherits

function patch(a, changes) {
  changes.forEach(function (patch) {
    a.splice.apply(a, patch)
  })
  
  return a
}

function split(str) {
  return str.split('\n').map(function (l, i, a) {
    if (i != a.length - 1) return l + '\n'
    
    return l
  })
}

module.exports = REdit

inherits(REdit, RArray)

function REdit() {
  if(!(this instanceof REdit)) return new REdit()
  RArray.call(this)
}

var R = REdit.prototype

R.text  = function text(text) {
  if(!arguments.length) return this.toJSON().join('')
  
  var old = this.toJSON()
  text = split(text)
  //Got to adjust the user's selection on the text area...
  var p = diff(old, text)
  patch(this, p)
}

R.unwrap = function() { }

R.wrap = function(ta) {
  if(!ta) throw new Error('wrap(ta) expects TextArea, or Input')

  var cursor = 0, start
  var self = this

  if(this.wrapped) throw new Error('rEdit is already wrapping a textarea. unwrap it first!')

  if(ta._rEditWrapper) ta._rEditWrapper.unwrap()

  ta._rEditWrapper = this
  this.wrapped = ta

  ta.value = this.text()

  function onPreupdate(ch) {
    //Force update when recieve message.
    cursor = 0
    start = ta.selectionStart
    end   = ta.selectionEnd
    //What atom contains the cursor?
    var startKey, sum = 0
    for (var i in self.keys) {
      var key = self.keys[i]
      if((sum = self.store[key].length + sum) >= start) {
        startKey = key; break
      }
    }
    //How much will be inserted into the document?
    for (var key in ch) {
      if (key < startKey) cursor += (ch[key] ? ch[key].length : 0) - (self.store[key] ? self.store[key].length : 0)
    }
    //THIS IS ACTUALLY WRONG. CAN'T insert into a selection!
    start = start + cursor
    end = end + cursor
  }
  this.on('preupdate', onPreupdate)
  
  function on_update(update) {
    if(update[2] !== self.id) {
      ta.value = self.toJSON().join('')
      ta.selectionStart = ta.selectionEnd = start
      ta.dispatchEvent(new Event('input'))
    }
  }
  this.on('_update'  , on_update)
  var pending = false
  
  function onInput() {
    self.text(ta.value)
  }
  
  function onKeydown() {
    start = ta.selectionStart
    end   = ta.selectionEnd
  }
  
  function onFocus() {
    ta.selectionStart = ta.selectionEnd = start
  }
  
  ta.addEventListener('input'  , onInput)
  ta.addEventListener('keydown', onKeydown)
  ta.addEventListener('focus'  , onFocus )

  this.unwrap = function() {
    ta.removeEventListener('input'  , onInput)
    ta.removeEventListener('keydown', onKeydown)
    ta.removeEventListener('focus'  , onFocus)
    this.removeListener('preupdate' , onPreupdate)
    this.removeListener('_update'   , on_update)
    this.unwrap = function() {}
  }

  return this
}
