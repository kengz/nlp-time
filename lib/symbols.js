// dependencies
var _ = require('lodash')


////////////////////////
// The CFG token maps //
////////////////////////

// Contain maps of lemma: [inflections]; NLP Lemmatization refers here: http://nlp.stanford.edu/IR-book/html/htmledition/stemming-and-lemmatization-1.html
// It is used to lemmatize: mapping all possible inflectional forms of a word into a basic form (lemma).
// This is better than regex match since it may cause unintended side effects, i.e. pulling the wrong part of sentence.
// Careful, when parsing, if argument not single-char (original key like m, h, d, w, M) make into lower case first

// The master maps in JSON, of symbol-name (e.g. op) to symbol-value (e.g. plus)
var maps = require('./maps.json')

// given a map, returns the lemma of a string str
// function lemma(map, str) {
//   return _.findKey(map, function(inflectionArr) {
//     return _.includes(inflectionArr, str)
//   })
// }

// auto scan through the maps n return lemma in the form of symbol value, name for use in symbol
function lemma(str) {
  var lem = {}
  var name = _.findKey(maps, function(sMap) {
    var value = _.findKey(sMap, function(inflectionArr) {
      return _.includes(inflectionArr, str)
    })
    if (value) { lem['value'] = value };
    return value
  })
  lem['name'] = name
  return lem
}

// console.log(lemma('plus'))
// console.log(lemma('zero'));
// ok then use to call constructor by string name

// declare the constructors for all types of symbols
var symbolConstructors = {
  op: op,
  c: c,
  r: r,
  n: n,
  t: t,
  dt: dt,
  custom: custom,
  f: f
}

function symbol(str) {
  lem = lemma(str);
  return new symbolConstructors[lem.name](lem.value)
}

console.log(symbol('zero'))
console.log(symbol('h'))


/////////////////////
// The CFG symbols //
/////////////////////


// arithmetic operator
// Note that since scaling is very rare, we omit its implementation for now.
function op(value) {}

// cron operator
function c(value) {}

// range operator
function r(value) {}

// number n, of the arithmetical system. 
// The rational numbers (try to parseFloat first, if fail then next)
// English numeric subset: one - thousand;
// a, an, half, quarter
// positional: first, second(beware of name-clash), third,...
function n(value) {
  this.value = parseFloat(value)
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
function custom(value) {
  this.value = value
}

function f() {}


// try to parse token string into symbol, in the given order of trials:
// 
function getSymbol(value) {

}


// var t1 = new t()
// var dt1 = new dt()
// console.log(t1)
// console.log(t1.constructor.name)
// console.log(dt1)
// console.log(dt1.constructor.name)

// op1 = new op('at')
// op1 = new op('one')
// console.log(op1)

// n1 = new n('1')
// console.log(n1)
