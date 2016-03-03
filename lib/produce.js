// Production rule module for the CFG

/**
 * Module Dependencies
 */

var _ = require('./subdash')
var util = require('./util')
var symbol = require('./symbol')
var tokenize = require('./tokenize')


// var str = "05 October 2011 14:48 UTC 08/11 2020 2012/12 event is at tonight 12/20- 23 12/22 - 12/23 12/22 - 12/25 05:30h 17:30 1730 1730pm 5pm 1 st"
var str = "quarter pop pop pop four hour and half from 17 and half pm before 9 tonight after 7 tonight"

function compose(str) {
  // Production rules: CFG algorithm for human language for time 
  // p#0: tokenize, remove nulls, pick tokens
  var syms = tokenize(str);
  syms = pickTokens(syms);
  // console.log('p#0', syms);
  // p#1: arithmetics: <n1>[<op>]<n2> ~ <n>, + if n1 > n2, * else
  syms = reduce(syms, ['n']);
  console.log('p#1', syms);
  // p#2: redistribute, <n1><T1>[<op>]<n2><!T2> ~ <n1>[<op>]<n2> <T1>
  syms = nTnRedistribute(syms);
  console.log('p#2', syms);
  // p#3: <n>[<op>]<T> ~ <T>, * if dt, + if t
  // p#4: <T>[<op>]<T> ~ <T>
  syms = reduce(syms, ['n', 'T']);
  console.log('p#3,4', syms);
  // p#5: defaulter <o> <n> <o> ~ <o> <T> <o>, d defaults to t:h
  syms = nDefTSyms(syms);
  console.log('p#5', syms);
  // p#6: <T><o><T> ~ <T>
  // console.log(symbol('t:,dt:=0h'))
  syms = optReduce(syms, ['T'], ['o'], symbol('t:,dt:=0s'), symbol(util.nowT()));
  console.log('p#6', syms);
  // p#7: auto-hour-modding: t:h mod 12
  syms = autoHourModding(syms);
  console.log('p#7', syms);

  // syms = [symbol('today'), symbol('til'), symbol('tomorrow')]
  // console.log("reSyms", syms)
  // syms = reduce(syms, ['T'], ['r'])
  // console.log('p#5', syms)
  // syms = reduce(syms, ['f', 'T', 'rT'], ['c'])
  // console.log('p#6', syms)
  return syms
}

compose(str)


/**
 * Production rule #0: pick tokens, remove nulls.
 * 1. break into chunks of arrs delimited by triple-null-or-more
 * 2. reorder chunks by arr length
 * 3.1 init candidate = []
 * 3.2 pull and push the chunks not containing <T> into candidate
 * 3.3 pull and push the chunks containing <T> into candidate
 * 4. pick the last candidate
 */
function pickTokens(syms) {
  // 1. 2. 3.
  var delimited = util.delimSyms(syms),
    chunks = util.splitSyms(delimited, 'trinull'),
    candidates = util.orderChunks(chunks);
  // 4.
  return candidates.pop()
}

/**
 * Reduce an array of symbols with binary operations between permissible symbols.
 * @param  {Array} syms   Array of input symbols
 * @param  {Array} varArr String names of permissible variables.
 * @param  {Array} opArr  String names of permissible operations.
 * @return {Array}        The reduced result.
 */
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
  for (var i = 0; i < syms.length; i++) {
    var s = syms[i]
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
      if (Array.isArray(past)) {
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
  }
  return res;
}

/**
 * Optional reduce: similar to reduce() but either argument is optional.
 * algorithm: return a T
 * 1. for each t, dt, do:
 * 2. for each key in union of keys for Lt, Rt, do:
 * 3. _Rt = _Rt op _Lt
 * @param  {Array} syms   Array of input symbols
 * @param  {Array} varArr String names of permissible variables.
 * @param  {Array} opArr  String names of permissible operations.
 * @param  {symbol} Ldef   default for left argument
 * @param  {symbol} Rdef   default for right argument
 * @return {Array}        The reduced result.
 */
// !prolly need cleaning to prevent adjacent <o>
function optReduce(syms, varArr, opArr, Ldef, Rdef) {
  // use peek
  var res = [],
    sum = null,
    L = null,
    R = null;
  for (var i = 0; i < syms.length; i++) {
    var s = syms[i];
    if (util.isSym(s, opArr)) {
      if (sum == null) {
        L = syms[i - 1];
        sum = (util.isSym(L, varArr)) ? L : Ldef;
      };
      R = syms[i + 1];
      // if is var skip it since will be consumed
      if (util.isSym(R, varArr)) { i++; }
      // else reset to default
      else { R = Rdef; }
      // compute:
      sum = execOp(sum, s, R);
      // before loop quits due to possible i++, push the last
      if (i == syms.length - 1) {
        res.push(sum)
      };
    } else {
      // s is not opArr, can't have been varArr either
      // edge case: at first dont push
      if (i > 0) {
        res.push(sum)
        res.push(s)
        sum = null
      }
    }
  }
  return res;
}

/**
 * Execute non-commutative operation between 2 argument symbols and an op symbol; carry out respective ops according to symbol names.
 * @param  {symbol} L  Left argument
 * @param  {symbol} op operation
 * @param  {symbol} R  Right argument
 * @return {symbol}    Result
 */
function execOp(L, op, R) {
  var otype = util.opType(L, op, R)
  if (_.includes(['nn'], otype)) {
    return nnOp(L, op, R)
  } else if (_.includes(['nT'], otype)) {
    return nTOp(L, op, R);
  } else if (_.includes(['TT'], otype)) {
    return TTOp(L, op, R);
  } else if (_.includes(['ToT', 'oT', 'To'], otype)) {
    console.log('running ToT')
    return ToTOp(L, op, R);
  } else if (_.includes(['rT', 'TrT'], otype)) {
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

/**
 * Atomic binary arithmetic operation on the numerical level, with default overriding the argument prepended with '='.
 * @param  {string|Number} Lval The left argument value.
 * @param  {symbol} op   The op symbol
 * @param  {string|Number} Rval The right argument value.
 * @return {Number}      Result from the operation.
 */
function atomicOp(Lval, op, Rval) {
  var l = parseFloat(Lval),
    r = parseFloat(Rval),
    oName = op.value;
  if (Lval == undefined) {
    // if L is missing, R must exist tho
    return (oName == 'minus') ? Rval.replace(/(\d)/, '-$1') : Rval;
  } else if (Rval == undefined) {
    // if L exists, be it def or not, R missing
    return Lval;
  } else {
    // or R exist or is default (parse to NaN), L can be default too but ignore then
    var def = _.isNaN(l) ? '=' : '';
    l = _.isNaN(l) ? parseFloat(Lval.replace('=', '')) : l;
    if (_.isNaN(r)) {
      // if R is default, just return L
      return Lval;
    } else if (oName == 'minus') {
      return def + (l - r)
    } else if (oName == 'plus') {
      return def + (l + r)
    } else if (oName == 'times') {
      return def + (l * r)
    } else if (oName == 'divide') {
      return def + (l / r)
    }
  }
}

/**
 * p#1: arithmetics: <n1>[<op>]<n2> ~ <n>, + if n1 > n2, * else
 */
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

/**
 * p#2: redistribute, <n1><T1>[<op>]<n2><!T2> ~ <n1>[<op>]<n2> <T1>
 * algorithm: note that from previous steps no <n>'s can occur adjacently
 * 1. scan array L to R, on each <n> found:
 * 2.1 if its R is <T>, continue;
 * 2.2 else, this is the target. do:
 * 3.1 init carry = []. remove and push <n> into carry,
 * 3.2 if its L is <op>, remove and prepend <op> into carry,
 * 4.1 find the first <n> to the left, if not <n>, drop the carry and continue;
 * 4.2 else merge the carry after the <n>
 * 5. At the end of loop, rerun production rule #1
 */
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
    carry.push(_.pullAt(syms, i));
    // 3.2
    var L = syms[i - 1]
    if (util.sName(L) == 'op') {
      carry.unshift(_.pullAt(syms, i - 1))
    };
    carry = _.flatten(carry)

    // 4.1
    var LLi = _.findLastIndex(syms.slice(0, i), function(Ls) {
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

/**
 * p#3: <n>[<op>]<T> ~ <T>, * if dt, + if t
 * 1. if t can be overidden, start from the lowest unit set to n, then return.
 * 2. otherwise, if <dt> not empty, <n><dt> = <n>*<dt>, then return
 * 3. else, if <t> not empty, <n><t> = <n>+<t>, then return
 */
function nTOp(nL, op, TR) {
  var tOverrideUnit = util.lowestOverride(TR.t);
  if (tOverrideUnit) {
    // 1.
    TR.t[tOverrideUnit] = nL.value
  } else if (_.keys(TR.dt).length) {
    // 2.
    op = op || symbol('times')
    for (var k in TR.dt) {
      TR.dt[k] = atomicOp(nL.value, op, TR.dt[k])
    }
  } else if (_.keys(TR.t).length) {
    // 3.
    op = op || symbol('plus')
    for (var k in TR.t) {
      TR.t[k] = atomicOp(nL.value, op, TR.t[k])
    }
  };
  return TR
}

/**
 * p#4: <T>[<op>]<T> ~ <T>
 */
function TTOp(TL, op, TR) {
  // set the default op
  op = op || symbol('plus');
  // util.sName
  // mutate into TL
  for (var k in TL.t) {
    TL.t[k] = atomicOp(TL.t[k], op, TL.t[k])
  }
  for (var k in TL.dt) {
    TL.dt[k] = atomicOp(TL.dt[k], op, TL.dt[k])
  }
  return TL
}

/**
 * p#5: defaulter <o> <n> <o> ~ <o> <T> <o>, d defaults to t:h
 */
function nDefTSyms(syms) {
  var res = []
  for (var i = 0; i < syms.length; i++) {
    var s = syms[i]
    res.push(util.isSym(s, ['n']) ? nDefT(s) : s)
  }
  return res;
}

/**
 * Helper: default a singlet n to T, i.e. next available hour
 */
function nDefT(n) {
  var deft = symbol('t:1h,dt:');
  var nVal = n.value;
  var currentHour = new Date().getHours();
  var nextnVal = Math.floor(currentHour / 12) * 12 + nVal;
  var tHour = execOp(symbol(nextnVal), symbol('times'), deft);
  return tHour
}

/**
 * p#6: <T><o><T> ~ <T>
 */
function ToTOp(L, op, R) {
  var Ttype = ['t', 'dt']
  for (var i = 0; i < Ttype.length; i++) {
    var _Ttype = Ttype[i];
    var concatKeys = _.keys(L[_Ttype]).concat(_.keys(R[_Ttype]))
    var keys = concatKeys.filter(function(elem, pos) {
      return concatKeys.indexOf(elem) == pos;
    })
    for (var j = 0; j < keys.length; j++) {
      var k = keys[j];
      // run atomic op, note the reversed order of R op L
      R[_Ttype][k] = atomicOp(R[_Ttype][k], op, L[_Ttype][k])
    }
  }
  return R
}

/**
 * p#7: auto-hour-modding: t:h mod 12
 */
function autoHourModding(syms) {
  for (var i = 0; i < syms.length; i++) {
    var s = syms[i]
    if (util.isSym(s, ['T'])) {
      if (syms[i]['t']['h']) {
        // if t has 'h', mod it
        var value = syms[i]['t']['h'].toString()
        var isDefault = (value.match(/^=/) || [])[0] || '';
        value = value.replace(/^=/, '');
        value = parseFloat(value) % 12;
        syms[i]['t']['h'] = isDefault + value;
      }
    }
  }
  return syms
}


// final resolution for T:
// 1. default an origin symbol.nowT() with given T.t, override default
// 2. add t and dt
// 3. convert to ISOstring via TtoStr TtoISO
function originDefault() {

}

/**
 * !to be implemented for range
 */
function rTOp(L, R) {
  var start, end;
  if (!R) {
    start = symbol(util.nowT());
    end = L;
  } else {
    start = L;
    end = R;
  }
  return symbol({ start: start, end: end })
}

/**
 * !to be implemented for cron
 */
function cTOp(L, R) {}
