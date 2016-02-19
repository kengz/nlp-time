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

// given a string, return a symbol from {∅,op,c,r,n,t,dt,custom,f}
function symbol(str, isDefault) {
  lem = lemma(str);
  return lem.name ? new symbolConstructors[lem.name](lem.value) : null;
}

// split numbers from words.
// - hour ~ `<t> ~ 1h`
// - 2hour ~ `2 hour ~ <n> <t> ~ 2*h ~ 2h`
// - pm ~ `12 hour ~ <n> <t> ~ 12*h ~ 12h`
// - 2pm ~ `2 pm ~ 2 12 hour ~ <n> <n> <t> ~ (2+12)*h ~ 14*h`
// - 1st ~ `1 st ~ 1 0 d ~ (1+0)*d`
// - evening ~ `(12+6)*h`
// - tonight at 7 ~ `=9pm at 7 ~ =9 12 hour + 7 ~ <=n> <n><t> <n>
// console.log(symbol('zero'))
// console.log(symbol('zero', true))
// console.log(symbol('poop'))
// console.log(symbol('hour'))
// console.log(symbol('tonight'))


/////////////////////
// The CFG symbols //
/////////////////////

// arithmetic operator
// Note that since scaling is very rare, we omit its implementation for now.
function op(value) {
  this.value = value
}

// cron operator
function c(value) {
  this.value = value
}

// range operator
function r(value) {
  this.value = value
}

// number n, of the arithmetical system. 
// The rational numbers (try to parseFloat first, if fail then next)
// English numeric subset: one - thousand;
// a, an, half, quarter
// positional: first, second(beware of name-clash), third,...
function n(value) {
  this.value = parseFloat(value)
}

// need a timeUnits

// time t, i.e. a point in the timeline
// units: ms, s, m, h, d, w, M, y
function t(value) {
  // need recursive search in the long term
  // Default values (origin)
  // this.ms = 0
  // this.s = 0
  // this.m = 0
  // this.h = 0
  // this.d = 0
  // this.w = 0
  // this.M = 0
  // this.y = 0
  value = value.split('')
  this[value] = 1
  this.isDefault = isDefault ? isDefault : false;
}

// time interval dt, i.e. an interval in the timeline
// units: dms, ds, dm, dh, dd, dw, dM, dy
function dt(value, isDefault) {
  // Default values (identify)
  // Same keys as <t> to allow for component-wise operation, e.g. t + dt = { ms+dms, s+ds, ... }
  // this.ms = 0
  // this.s = 0
  // this.m = 0
  // this.h = 0
  // this.d = 0
  // this.w = 0
  // this.M = 0
  // this.y = 0
  // mute them for default value overriding
  this[value] = 1
  this.isDefault = isDefault ? isDefault : false;
}

// the human customs, e.g. noon, afternoon, dawn, evening, today, tonight, Sunday, fortnight, weekdays, weekends, christmas, spring, summer, holidays etc.
// Maps to predefined values of <t> or <dt>.
function custom(value) {
  var split = value.split(',')
}


// implementation details:
// custom syntax,
// `:` means "set"
// `=` means "default"
// e.g.:
// evening ~ t:=7h,dt:12h, read as "t set to default 7h, dt set to 12h"
// later ~ t:,dt:=3h, read as "t set to nothing, dt set to default 3h"
// beware "nothing" and "0" are different, the former is null, the latter a numerical value.


function f(value) {}


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
