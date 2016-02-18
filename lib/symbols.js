// dependencies
var _ = require('lodash')


////////////////////////
// The CFG token maps //
////////////////////////

// Contain maps of lemma: [inflections]; NLP Lemmatization refers here: http://nlp.stanford.edu/IR-book/html/htmledition/stemming-and-lemmatization-1.html
// It is used to lemmatize: mapping all possible inflectional forms of a word into a basic form (lemma).
// This is better than regex match since it may cause unintended side effects, i.e. pulling the wrong part of sentence.
// Careful, when parsing, if argument not single-char (original key like m, h, d, w, M) make into lower case first

// The master maps from JSON
var maps = require('./maps.json')

// given a map, returns the lemma of a string str
function lemma(map, str) {
  return _.findKey(map, function(inflectionArr) {
    return _.includes(inflectionArr, str)
  })
}

// operator map
var opMap = maps.opMap;
// cron map
// simple for now, use 'every'. But advanced modes include:
// what about: daily, weekly, monthly, yearly
// or: twice a week
var cMap = maps.cMap;
// range map
var rMap = maps.rMap;
// number map
var nMap = maps.nMap;
// time map
var tMap = maps.tMap;
// custom map
var customMap = maps.customMap;
// frequency map
var fMap = maps.fMap;


/////////////////////
// The CFG symbols //
/////////////////////


// arithmetic operator
// Note that since scaling is very rare, we omit its implementation for now.
function op(str) {
  this.name = lemma(opMap, str)
}

// cron operator
function c(str) {
  this.name = lemma(cMap, str)
}

// range operator
function r(str) {
  this.name = lemma(rMap, str)
}

// number n, of the arithmetical system. 
// The rational numbers (try to parseFloat first, if fail then next)
// English numeric subset: one - thousand;
// a, an, half, quarter
// positional: first, second(beware of name-clash), third,...
function n(str) {
  this.name = parseFloat(str) || parseFloat(lemma(nMap, str))
}

// time t, i.e. a point in the timeline
// units: ms, s, m, h, d, w, M, y
function t() {
  // Default values (origin)
  this.ms = 0
  this.s = 0
  this.m = 0
  this.h = 0
  this.d = 0
  this.w = 0
  this.M = 0
  this.y = 0
}

// time interval dt, i.e. an interval in the timeline
// units: dms, ds, dm, dh, dd, dw, dM, dy
function dt() {
  // Default values (identify)
  // Same keys as <t> to allow for component-wise operation, e.g. t + dt = { ms+dms, s+ds, ... }
  this.ms = 0
  this.s = 0
  this.m = 0
  this.h = 0
  this.d = 0
  this.w = 0
  this.M = 0
  this.y = 0
}

// the human customs, e.g. noon, afternoon, dawn, evening, today, tonight, Sunday, fortnight, weekdays, weekends, christmas, spring, summer, holidays etc.
// Maps to predefined values of <t> or <dt>.
function custom() {}

function f() {}



var t1 = new t()
var dt1 = new dt()
console.log(t1)
console.log(t1.constructor.name)
console.log(dt1)
console.log(dt1.constructor.name)

op1 = new op('at')
console.log(op1)

n1 = new n('1')
console.log(n1)
