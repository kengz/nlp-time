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
var SymbolConstructors = {
  Op: Op,
  C: C,
  R: R,
  N: N,
  T: T,
  Dt: Dt,
  Custom: Custom,
  F: F
}

// given a string, return a symbol from {∅,op,c,r,n,t,dt,custom,f}
function Symbol(str, isDefault) {
  lem = lemma(str);
  return lem.name ? new SymbolConstructors[lem.name](lem.value) : null;
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
function Op(value) {
  this.value = value
}

// cron operator
function C(value) {
  this.value = value
}

// range operator
function R(value) {
  this.value = value
}

// number n, of the arithmetical system. 
// The rational numbers (try to parseFloat first, if fail then next)
// English numeric subset: one - thousand;
// a, an, half, quarter
// positional: first, second(beware of name-clash), third,...
function N(value) {
  this.value = parseFloat(value)
}

// time t, i.e. a point in the timeline
// units: ms, s, m, h, d, w, M, y
// all the values are still string, so that can capture the "=" default symbol in the units.
// when performing numerical operation, rmb to use parseFloat
function T(value) {
  // guard against falsy input
  if (!value) {
    return; }
  // 1. see if starts with "=" for default, or set to ''
  var isDefault = _.first(value.match(/^=/)) || '';
  value = value.replace(/^=/, '');
  // 2. then consume chunks of <number><timeUnit> like "30m"
  while (value) {
    var number = _.first(value.match(/^\d+/));
    value = value.replace(/^\d+/, '');
    var unit = _.first(value.match(/^[a-zA-Z]+/));
    value = value.replace(/^[a-zA-Z]+/, '');
    // prepend the number (string) with isDefault, i.e. "=" or ""
    this[unit] = isDefault + number
  }
}

// time interval dt, i.e. an interval in the timeline
// units: ms, s, m, h, d, w, M, y
// Same keys as <t> to allow for component-wise operation, e.g. t + dt = { ms+(d)ms, s+(d)s, ... }
function Dt(value) {
  // guard against falsy input
  if (!value) {
    return; }
  // 1. see if starts with "=" for default, or set to ''
  var isDefault = _.first(value.match(/^=/)) || '';
  value = value.replace(/^=/, '');
  // 2. then consume chunks of <number><timeUnit> like "30m"
  while (value) {
    var number = _.first(value.match(/^\d+/));
    value = value.replace(/^\d+/, '');
    var unit = _.first(value.match(/^[a-zA-Z]+/));
    value = value.replace(/^[a-zA-Z]+/, '');
    // prepend the number (string) with isDefault, i.e. "=" or ""
    this[unit] = isDefault + number
  }
}

// console.log(new T("=7h30m"))
// console.log(new T(""))
// console.log(new T(undefined))
// console.log(new Dt("=7h30m"))


// the human customs, e.g. noon, afternoon, dawn, evening, today, tonight, Sunday, fortnight, weekdays, weekends, christmas, spring, summer, holidays etc.
// Maps to predefined values of <t> or <dt>.
function Custom(value) {
  var split = value.split(','),
    _t = _.last(split[0].split(':')),
    _dt = _.last(split[1].split(':')),
    t = new T(_t),
    dt = new Dt(_dt);
  console.log(t, dt)
}

// new Custom("t:=7h,dt:0h")


// implementation details:
// custom syntax,
// `:` means "set"
// `=` means "default"
// must delimit by comma, as <t>,<dt>, so both sides must be present
// e.g.:
// evening ~ t:=7h,dt:12h, read as "t set to default 7h, dt set to 12h"
// later ~ t:,dt:=3h, read as "t set to nothing, dt set to default 3h"
// beware "nothing" and "0" are different, the former is null, the latter a numerical value.


function F(value) {}


// try to parse token string into symbol, in the given order of trials:
// 
function getSymbol(value) {

}


// var t1 = new T()
// var dt1 = new Dt()
// console.log(t1)
// console.log(t1.constructor.name)
// console.log(dt1)
// console.log(dt1.constructor.name)

// op1 = new Op('at')
// op1 = new Op('one')
// console.log(op1)

// n1 = new N('1')
// console.log(n1)
