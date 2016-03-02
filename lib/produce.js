// progressive filter:
// take on array, drop null, operate on an op, (like * / first, then + -)
// after finite step = depth of CFG tree, is done
// yess yess, binary ops, can progress atomically. exactly like arithmetic
//ok operator precedence: 

// dependencies
var _ = require('lodash');
var util = require('./util')
var tokenize = require('./tokenize')
var symbol = require('./symbols')
var timeUnitOrder = util.timeUnitOrder

// var maps = require('./maps.json')

// ok new production rules, binary op like arithmetics:
// 1. <n><n> ~ <n>
// 2. <n><T>[<op> <n2> !<T>] ~ <n>[<op><n2>]<T> ~ <n><T> ~ <T>
// 3. <T><T> ~ <T>
// 4. <T><r><T> ~ <rT>
// 5. [<f>]<c><T|rT> ~ <cT>

// Production rule #0: pick chunk, remove nulls
// pick a single sensible timechunk from syms
// in case of [s, null, null, null, s, s, s, null, null, null, s, ..]
// 1. break into chunks of arrs delimited by triple-null-or-more
// 2. reorder chunks by arr length
// 3.1 init candidate = []
// 3.2 pull and push the chunks not containing <T> into candidate
// 3.3 pull and push the chunks containing <T> into candidate
// 4. pick the last candidate
function getTimeChunk(syms) {
  var delimited = util.delimSyms(syms)
  var chunks = util.splitSyms(delimited, 'trinull')
  var candidates = util.orderChunks(chunks);
  // 4.
  return candidates.pop()
}

// production rule #2
// algorithm: note that from previous steps no <n>'s can occur adjacently
// 1. scan array L to R, on each <n> found:
// 2.1 if its R is <T>, continue;
// 2.2 else, this is the target. do:
// 3.1 init carry = []. remove and push <n> into carry,
// 3.2 if its L is <op>, remove and prepend <op> into carry,
// 4.1 find the first <n> to the left, if not <n>, drop the carry and continue;
// 4.2 else merge the carry after the <n>
// 5. At the end of loop, rerun production rule #1
function nTnRedistribute(syms) {
  // 1.
  for (var i = 0; i < syms.length; i++) {
    var s = syms[i]
    if (util.sName(s) != 'n') {
      continue;
    };
    // 1.

    var R = syms[i + 1]
    if (util.sName(R) == 'T') {
      continue;
    };
    // 2.2

    // 3.1
    var carry = [];
    carry.push(_.pullAt(syms, i))
      // 3.2
    var L = syms[i - 1]
    if (util.sName(L) == 'op') {
      carry.unshift(_.pullAt(syms, i - 1))
    };
    carry = _.flatten(carry)

    // 4.1
    var LLi = _.findLastIndex(_.slice(syms, 0, i), function(Ls) {
      return util.sName(Ls) == 'n'
    })
    if (!syms[LLi] || util.sName(syms[LLi + 1]) != 'T') {
      continue;
    };

    // 4.2
    syms.splice(LLi + 1, 0, carry)
    syms = _.flatten(syms)
  }

  // 5.
  syms = reduce(syms, ['n'])
  return syms;
}


// production rule #4
// 3. recombine (without the os)
// 4. run <T><o><T> ops
function ToTOp(syms) {
  console.log("running ToTOp")
  // split them by o
  var chunks = util.splitSyms(syms, 'o');
  // wait, need to respect o ops. e.g. from/before/ago
  // combine back with the old os

  // recombine for TTOp
  var newSyms = _.flatten(chunks)
    // perform TTOp
  return reduce(newSyms, ['T'])
}


// production rule #4
// 1. use <o> to split syms
// 2. if is <o> <n> <o>, default to <t:h>, with modding shit
function nDefTSyms(syms) {
  return _.map(syms, function(s) {
    return util.isSym(s, ['n']) ? nDefT(s) : s;
  })
}
// default a singlet n to T, i.e. next available hour
function nDefT(n) {
  var deft = symbol('t:1h,dt:');
  var nVal = n.value;
  var currentHour = new Date().getHours();
  var nextnVal = _.floor(currentHour / 12) * 12 + nVal;
  var tHour = execOp(symbol(nextnVal), symbol('times'), deft);
  return tHour
}


/////////////
// Helpers //
/////////////



// helper: generic binary-reduction function.
function reduce(syms, varArr, opArr) {
  // the operator arrays
  var opArr = opArr || ['op'];
  // endmark for handling last symbol
  syms.push('null');
  // the result, past-pointer(previous non-null symbol), default-op, current-op, and whether current-op is inter-symbol op, i.e. will not be used up
  var res = [],
    past = null,
    defOp = null,
    op = defOp,
    interOp = false;
  _.each(syms, function(s, i) {
    if (!past || !s) {
      // edge case or null
      if (i == 0) { past = s; }
    } else if (util.isSym(s, opArr)) {
      // s is an op. mark op as won't be used yet
      op = s;
      interOp = true;
      // the nDefT for when past = 'n', s = 'o'
    } else if (util.isSym(s, varArr) && util.isSym(past, varArr)) {
      // s and past are operable variables specified by varArr
      past = execOp(past, op, s);
      // reset after op is used
      op = defOp;
      interOp = false;
    } else {
      // no further legal operation made, push and continue
      // change of class, past is finalized, push to res
      res.push(past);
      if (_.isArray(past)) {
        // if past was returned from execOp as array (not executed), then flatten it and dont push op to res, since it's already included in op
        res = _.flatten(res)
      } else {
        // if inter-op (not used), push a clone (prevent overwrite later)
        if (interOp) { res.push(symbol(op.value)) };
      }
      // reset
      op = defOp;
      interOp = false;
      past = s;
    }
  })
  return res;
}

// helper: exececute binary operation, note that order matters,
// if cannot be executed, returns the triple in array, to be flattened in the res
function execOp(L, op, R) {
  // ok def ops between:
  // consider ifelse cond precedence
  // also consider when optional arg
  // 1. <n><n> ~ <n>
  // 2. <n><T>[<op> <n2> !<T>] ~ <n>[<op><n2>]<T> ~ <n><T> ~ <T>
  // 3. <T><T> ~ <T>
  // 4. <T><r><T> ~ <rT>
  // 5. [<f>]<c><T|rT> ~ <cT>
  var otype = opType(L, op, R)
  if (_.includes(['nn'], otype)) {
    return nnOp(L, op, R)
  } else if (_.includes(['nT'], otype)) {
    return nTOp(L, op, R);
  } else if (_.includes(['TT'], otype)) {
    return TTOp(L, op, R);
  } else if (_.includes(['ToT'], otype)) {
    return ToTOp(L, op, R);
  } else if (_.includes(['rT', 'TrT'], otype)) {
    console.log('calling r', otype)
      // has optional arg
    return rTOp(L, R);
  } else if (_.includes(['cT', 'fcT', 'crT', 'fcrT'], otype)) {
    // has optional arg
    return cTOp(L, R);
  } else {
    // not executable, e.g. not in the right order, return fully
    return [L, op, R]
  }
}

// helper: determine the op type based on arguments
function opType(L, op, R) {
  var LsName = util.sName(L) || '',
    RsName = util.sName(R) || '';
  var opsName = util.sName(op);
  if (opsName != 'o' && opsName != 'r' && opsName != 'c') { opsName = '' };
  return LsName + opsName + RsName
}

// opType(symbol('one'), symbol('plus'), symbol('zero'))
// opType(null, symbol('plus'), symbol('christmas'))

// done. 
// production rule #1
function nnOp(L, op, R) {
  var l = L.value,
    r = R.value;
  // set the default op according to value in nn op
  if (l > r) {
    op = op || symbol('plus')
  } else {
    op = op || symbol('times')
  }
  var res = atomicOp(l, op, r);
  return symbol(res)
}



// nTnRedistribute([symbol(1), null, null, symbol(1)])
// console.log(_.range(10)[100])

// ehh maybe dont put down the os yet before rT, so there can be tomorrow at 7-9 pm
// ohh still need unit override at the end
function rTOp(L, R) {
  var start, end;
  if (!R) {
    console.log("exec here")
    start = symbol(util.nowT());
    end = L;
    console.log("startend", start, end)
  } else {
    start = L;
    end = R;
  }
  return symbol({ start: start, end: end })
}


// console.log(rTOp(symbol('tomorrow')))


function cTOp(L, R) {

}

// ok how to apply to t or dt
// aiight fix this shit. e.g. 7 pm, 7 and half pm
// 1. if t can be overidden, start from the lowest unit set to n, then return.
// 2. otherwise, if <dt> not empty, <n><dt> = <n>*<dt>, then return
// 3. else, if <t> not empty, <n><t> = <n>+<t>, then return
function nTOp(nL, op, TR) {
  var tOverrideUnit = lowestOverride(TR.t);
  if (tOverrideUnit) {
    // 1.
    TR.t[tOverrideUnit] = nL.value
  } else if (!_.isEmpty(TR.dt)) {
    // 2.
    op = op || symbol('times')
    _.each(TR.dt, function(v, k) {
      TR.dt[k] = atomicOp(nL.value, op, TR.dt[k])
    })
  } else if (!_.isEmpty(TR.t)) {
    // 3.
    op = op || symbol('plus')
    _.each(TR.t, function(v, k) {
      TR.t[k] = atomicOp(nL.value, op, TR.t[k])
    })
  };
  return TR
}

// find the lowest overridable unit in t or dt
function lowestOverride(t) {
  var overable = _.pickBy(t, function(v, k) {
    return /^=/.exec(v)
  })
  var overableUnits = _.keys(overable)
  var lowestOverable = _.find(timeUnitOrder, function(unit) {
    return _.includes(overableUnits, unit)
  })
  return lowestOverable
}

// lowestOverride({
//   y: '10',
//   M: '20',
//   w: '30',
//   d: '40'
// })

// done
// distribute scalar L over tensor R, using atomicOp
// or override tensor L and tensor R, or R preceeds
// doesn't apply to t,dt yet
// return R entity, or ct, rt
function TTOp(TL, op, TR) {
  // set the default op
  op = op || symbol('plus')
    // util.sName
    // mutate into TR
  _.each(TL.t, function(v, k) {
    TR.t[k] = atomicOp(TL.t[k], op, TR.t[k])
  })
  _.each(TL.dt, function(v, k) {
    TR.dt[k] = atomicOp(TL.dt[k], op, TR.dt[k])
  })
  return TR
}

//q2 running atomic binary op, between numbers
// either side can be starting with '=', or null, then just drop em
function atomicOp(Lval, op, Rval) {
  var l = parseFloat(Lval),
    r = parseFloat(Rval),
    oName = op.value;
  if (Lval == undefined) {
    // if L is missing, R must exist tho
    return Rval
  } else if (Rval == undefined) {
    // if L exists, be it def or not, R missing
    return (oName == 'minus') ? Lval.replace(/(\d)/, '-$1') : Lval;
  } else {
    // or R exist or is default (parse to NaN), L can be default too but ignore then
    var def = _.isNaN(r) ? '=' : '';
    r = _.isNaN(r) ? parseFloat(Rval.replace('=', '')) : r;
    if (_.isNaN(l)) {
      // if L is default, just return R
      return Rval;
    } else if (oName == 'minus') {
      return def + (r - l)
    } else if (oName == 'plus') {
      return def + (r + l)
    } else if (oName == 'times') {
      return def + (r * l)
    } else if (oName == 'divide') {
      return def + (r / l)
    }
  }
}


// var str = "05 October 2011 14:48 UTC 08/11 2020 2012/12 event is at tonight 12/20- 23 12/22 - 12/23 12/22 - 12/25 05:30h 17:30 1730 1730pm 5pm 1 st"
var str = "quarter pop pop pop four hour and half from 7 and half pm pop pop pop at 2st at 7 tonight"

function compose(str) {
  var tok = tokenize(str)
  var syms = tok.symbols;
  console.log(syms)

  var syms = getTimeChunk(syms)
  console.log('p#0', syms)
  syms = reduce(syms, ['n'])
  console.log('p#1', syms)
  syms = nTnRedistribute(syms)
  console.log('p#2', syms)
  syms = reduce(syms, ['n', 'T'])
  console.log('p#3', syms)
    // |n| -> |T|
  syms = nDefTSyms(syms)
    // TT op/o
  syms = reduce(syms, ['T'], ['op', 'o'])
    // syms = ToTOp(syms)
  console.log('p#4', syms)

  // syms = [symbol('today'), symbol('til'), symbol('tomorrow')]
  // console.log("reSyms", syms)
  // syms = reduce(syms, ['T'], ['r'])
  // console.log('p#5', syms)
  // syms = reduce(syms, ['f', 'T', 'rT'], ['c'])
  // console.log('p#6', syms)
  return syms
}
compose(str)
// actually make an origin T, add as default
console.log(util.nowT())
console.log(symbol(util.nowT()))
function finalT() {

}

// console.log(compose(str))

// console.log(nDefTSyms([symbol('at'), symbol('two'), symbol('at')]))

// next ops:
// [T]rT
// [f]T | [f]rT 



// var t1 = symbol('tonight')
// var t2 = symbol('christmas')
// console.log(t1)
// console.log(t2)
// TTOp(t1, symbol('plus'), t2)
// console.log("post op")
// console.log(t1)
// console.log(t2)
// console.log("postNTOp")
// nTOp(symbol('two'), symbol('times'), t2)
// console.log(t2)
