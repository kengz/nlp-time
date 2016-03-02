// dependencies
var _ = require('lodash')


////////////////////////
// the CFG token maps //
////////////////////////

// this is beter than regex match since it may cause unintended side efects, i.e. pulling the wrong part of sentence.
// careful, when parsing, if argument not single-char (original key like m, h, d, w, M) make into lower case first

// the master maps in JSON, format:
// { symbol-name: {symbol-value: [inflections]}, ...}
var maps = require('./maps.json')


// the constructors for all types of symbols
var symbolConstructors = {
  op: op,
  c: c,
  r: r,
  n: n,
  t: T,
  dt: T,
  T: T,
  f: f,
  o: o,
  rT: rT
}

// The T string regex, e.g. "t:=9h,dt:12h", to encode T = <t> <dt>
var reT = /t\:\S*,dt\:\S*/g

/**
 * Return the lemma symbol of a word string, i.e. the name and value of the symbol it belongs to in the CFG. Uses ./maps.json.
 * NLP Lemmatization refers here: htp://nlp.stanford.edu/Ir-book/html/htmledition/stemming-and-lemmatization-1.html. Inflections = all possible alternative words of a lemma.
 * @param  {string} str the word to lemmatize.
 * @return {JSON}     the lemma symbol {name, value} for CFG
 * @example
 * lemma('zero')
 * // => { value: '0', name: 'n' }
 */
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
// console.log(lemma('zero'))

/**
 * The symbol constructor, given a string, lemmatize it, then return a symbol from {∅=null,op,c,r,n,t,dt,T,f}.
 * i.e. str -> parseFloat(str) -> new n(str) -> return
 * or str -> lemma(str) -> new <symbol-name>(symbol-value) -> return
 * @param {string}  str       the input string
 * @return {*} The object from the class of symbols
 * @example
 * symbol('90')
 * // => n { value: 10 }
 * symbol('hour')
 * // a <dt> time difference object
 * // => dt { h: '1' }
 * symbol('tonight')
 * // or equivalently, takes the T string too
 * symbol('t:=9h,dt:12h')
 * // a T object containing <t>, <dt>
 * // => T { t: t { h: '=9' }, dt: dt { h: '12' } }
 * symbol('unrecognized')
 * // an unrecognized string yields the null symbol ∅
 * // => null
 */
function symbol(str) {
  if (!str) {
    // null gets null
    return null;
  } else if (_.has(str, 'start') && _.has(str, 'end')) {
    // range: with 'start' and 'end'
    return new symbolConstructors['rT'](str)
  } else if (parseFloat(str)) {
    // 'n'
    return new symbolConstructors['n'](str)
  } else if (str.match(reT)) {
    // if is of the T string format t:<val>,dt:<val>
    return new symbolConstructors['T'](str)
  };
  lem = lemma(str);
  return lem.name ? new symbolConstructors[lem.name](lem.value, lem.name) : null;
}

// console.log(symbol('10'))
// console.log(symbol('hour'))
// console.log(symbol('tonight'))
// console.log(symbol('t:=9h,dt:12h'))
// console.log(symbol('unrecognized'))


/////////////////////
// the CFG symbols //
/////////////////////
///Note these constructors below are called from within symbol()

// split numbers from words.
// - hour ~ `<t> ~ 1h`
// - 2hour ~ `2 hour ~ <n> <t> ~ 2*h ~ 2h`
// - pm ~ `12 hour ~ <n> <t> ~ 12*h ~ 12h`
// - 2pm ~ `2 pm ~ 2 12 hour ~ <n> <n> <t> ~ (2+12)*h ~ 14*h`
// - 1st ~ `1 st ~ 1 0 d ~ (1+0)*d`
// - evening ~ `(12+6)*h`
// - tonight at 7 ~ `=9pm at 7 ~ =9 12 hour + 7 ~ <=n> <n><t> <n>


/**
 * The op constructor for arithmetic operator.
 * note that since scaling(*,/) is very rare, we omit its implementation for now.
 * @param  {string} value from the Symbol.
 */
function op(value) {
  this.value = value
}

/**
 * The cron operator constructor.
 * @param  {string} value from the Symbol.
 */
function c(value) {
  this.value = value
}

/**
 * The range operator constructor.
 * @param  {string} value from the Symbol.
 */
function r(value) {
  this.value = value
}

/**
 * The n number constructor. Calls parseFloat.
 * @param  {string} value from the Symbol.
 */
function n(value) {
  this.value = parseFloat(value)
}

/**
 * The t constructor for time t, i.e. a point in the timeline
 * units: ms, s, m, h, d, w, M, y
 * All values are string, to represent the "=" default in the units. so when performing numerical operation, use parseFloat.
 * @param  {string} value from the Symbol.
 * @example
 * new t(undefined)
 * new t("")
 * // => t {}
 * new t("7h30m")
 * // => t { h: '7', m: '30' }
 * new t("=7h30m")
 * // => t { h: '=7', m: '30' }
 * new t("=7h=30m")
 * // => t { h: '=7', m: '=30' }
 */
function t(value) {
  // guard against falsy input
  if (!value) {
    return null;
  }
  // 1. see if unit is prepended with "=" for default, or set to ''
  // 2. then consume chunks of <number><timeUnit> like "30m"
  while (value) {
    var isDefault = _.first(value.match(/^=/)) || '';
    value = value.replace(/^=/, '');
    // default number is "1"
    var number = _.first(value.match(/^\d+(\.\d+)?/)) || "1";
    value = value.replace(/^\d+(\.\d+)?/, '');
    var unit = _.first(value.match(/^[a-zA-Z]+/));
    value = value.replace(/^[a-zA-Z]+/, '');
    // prepend the number (string) with isDefault, i.e. "=" or ""
    this[unit] = isDefault + number
  }
}

/**
 * The dt constructor for time t, i.e. a displacement in the timeline
 * units: ms, s, m, h, d, w, M, y
 * All values are string, to represent the "=" default in the units. so when performing numerical operation, use parseFloat.
 * Same keys as <t> to allow for component-wise operation, e.g. t + dt = { ms+(d)ms, s+(d)s, ... }
 * @param  {string} value from the Symbol.
 */
function dt(value) {
  // guard against falsy input
  if (!value) {
    return null;
  }
  // 1. see if unit is prepended with "=" for default, or set to ''
  // 2. then consume chunks of <number><timeUnit> like "30m"
  while (value) {
    var isDefault = _.first(value.match(/^=/)) || '';
    value = value.replace(/^=/, '');
    // default number is "1"
    var number = _.first(value.match(/^\d+(\.\d+)?/)) || "1";
    value = value.replace(/^\d+(\.\d+)?/, '');
    var unit = _.first(value.match(/^[a-zA-Z]+/));
    value = value.replace(/^[a-zA-Z]+/, '');
    // prepend the number (string) with isDefault, i.e. "=" or ""
    this[unit] = isDefault + number
  }
}

// console.log(new t(undefined))
// console.log(new t(""))
// console.log(new t("7h30m"))
// console.log(new t("=7h30m"))
// console.log(new t().constructor.name)


/**
 * The T constructor, implementation-specific, is a linear combination of <t> and <dt>.
 * Used to capture the human Ts, e.g. noon, afternoon, dawn, evening, today, tonight, Sunday, fortnight, weekdays, weekends, christmas, spring, summer, holidays etc.
 * To specify T in maps.json, follow the syntax:
 * `:` means "set", `=` means "default", use t:<value>,dt:<value> for the symbol-value, e.g. "t:=7h,dt:0h"
 * evening ~ t:=7h,dt:12h, read as "t set to default 7h, dt set to 12h"
 * later ~ t:,dt:=3h, read as "t set to nothing, dt set to default 3h"
 * beware, "" and "0" are diferent, the former is empty, the later a numerical value.
 * @param  {string} value from the Symbol.
 * @param  {string} [name] from the Symbol.
 * @example
 * var T = new T("t:=7h,dt:0h")
 * // => T { t: t { h: '=7' }, dt: dt { h: '0' } }
 * T.t
 * // => t { h: '=7' }
 * T.dt
 * // => t { h: '0' }
 */
function T(value, name) {
  if (name == 't') {
    this.t = new t(value);
    this.dt = new dt();
  } else if (name == 'dt') {
    this.t = new t();
    this.dt = new dt(value);
  } else {
    var split = value.split(','),
      _t = _.last(split[0].split(':')),
      _dt = _.last(split[1].split(':'));
    this.t = new t(_t);
    this.dt = new dt(_dt);
  }
}

// var T = new T("t:=7h,dt:0h")
// console.log(T.t)
// console.log(T.dt)

/**
 * The f constructor to capture frequency for <c>.
 * @param  {string} value from the Symbol.
 */
function f(value) {
  this.value = value;
}

function o(value) {
  this.value = value;
}

function rT(interval) {
  this.start = interval.start;
  this.end = interval.end;
}


module.exports = symbol;
