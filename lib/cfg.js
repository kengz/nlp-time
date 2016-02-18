// @author: kengz kengzwl@gmail.com Feb 2016
// A model of the human language for time using CFG and Euclidean transformations.
// Basis: The timeline a is 1D euclidean number line, thus it obeys all the Euclidean transformations (in 1D, which happens to be scalar arithmetics). The human language used to describe and the timeline and its transformations is a Context-Free Grammar; moreover, CFG is sufficient to describe the timeline and its Euclidean transformations, since it is just the arithmetic CFG (and a bit more).

// dependencies
var _ = require('lodash')


//////////////////////
// The keyword maps //
//////////////////////
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

// time map
var tMap = maps.tMap;
// operator map
var opMap = maps.opMap;
// every map
// simple for now, use 'every'. But advanced modes include:
// what about: daily, weekly, monthly, yearly
// or: twice a week
var everyMap = maps.everyMap;
// number map
var nMap = maps.nMap;
// custom map
var customMap = maps.customMap;


//////////////////////
// The CFG entities //
//////////////////////

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

// operator op, of the arithmetical system. Translation (positive and negative) and scaling (positive and negative). 
// Note that since scaling is very rare, we omit its implementation for now.
// + (plus): and, at, on, in, past, after, later, ...
// - (minus): before, ago, earlier
// * multiplication can go between numbers
// The operator pattern is: <t> <op> <dt>
function op(str) {
  this.name = lemma(opMap, str)
}

// The extra operator cron (the cron time pattern for repetition), outside of the arithmetical system. This keeps the human timeline language in CFG since it is isomorphic to the arithmetical operators. i.e. human timeline language = arithmetic CFG + repeaterOp
// every, repeat
// The operator pattern is: <t> <every> <dt>
function every(str) {
  this.name = lemma(everyMap, str)
}

// number n, of the arithmetical system. 
// The rational numbers (try to parseFloat first, if fail then next)
// English numeric subset: one - thousand;
// a, an, half, quarter
// positional: first, second(beware of name-clash), third,...
function n(str) {
  this.name = parseFloat(str) || parseFloat(lemma(nMap, str))
}

// the human customs, e.g. noon, afternoon, dawn, evening, today, tonight, Sunday, fortnight, weekdays, weekends, christmas, spring, summer, holidays etc.
// Maps to predefined values of <t> or <dt>.
function custom() {}




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
