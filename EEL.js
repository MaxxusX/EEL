const EEL = (() => {
  "use strict";

  /**
   * Easily Extendable Language
   * Copyright (c) 2024 Maxxus
   * MIT License (https://opensource.org/license/mit)
   *
   * This language is a bit different than what you're used to.
   * Scope doesn't exist. Anything (excluding spaces) can be a variable.
   * Variables cannot be destroyed, but they can always be overwritten.
   * Null and Undefined values don’t exist. The only type is "string".
   * I'm not joking. The only type is strings. When modifying this
   * source code, remember to use toNumber. the "number", "string",
   * and "looselyequals" commands exist because there's probably some
   * annoying "feature" that needs a bandaid. When accessing variables or
   * using a function inside a function, prefix the name with a dash (-).
  **/

  const version = "1.1.0";
  const debugging = false;
  const debug = !debugging ? (() => true) : ((...txt) => console.log(...txt));
  const combine = (...strings) => {
    if (!strings) {
      return "";
    };
    if (strings.length === 1) {
      return strings[0];
    };
    let output = "";
    strings.forEach(str => {
      output = output.concat(str.toString());
    });
    return output;
  };
  const commands = {
    /**
     * log is what to output into the log (default: undefined (no log))
     * val is what the command returns (default: true)
     * vars is new variables (default: {})
     * stop is if the program should stop (default: false)
    **/
    print: {params: 2**52, func: p => ({ log: "0," + p.join(" ") })},
    warn: {params: 2**52, func: p => ({ log: "1," + p.join(" ") })},
    error: {params: 2**52, func: p => ({ log: "2," + p.join(" "), stop: true })},
    stop: {params: 2**52, func: p => ({ log: "3," + p.join(" "), stop: true })},
    
    set: {params: 2**52, func: p => ({ vars: [p.shift(), p.join(" ")], val: p.join(" ")})},
    
    add: {params: 2, func: p => ({ val: Number(p[0]) + Number(p[1]) })},
    sub: {params: 2, func: p => ({ val: Number(p[0]) - Number(p[1]) })},
    mul: {params: 2, func: p => ({ val: Number(p[0]) * Number(p[1]) })},
    div: {params: 2, func: p => ({ val: Number(p[0]) / Number(p[1]) })},
    pow: {params: 2, func: p => ({ val: Number(p[0]) ^ Number(p[1]) })},
    sqrt: {params: 1, func: p => ({ val: Math.sqrt(p[0]) })},
    cbrt: {params: 1, func: p => ({ val: Math.cbrt(p[0]) })},
    
    abs: {params: 1, func: p => ({ val: Math.abs(p[0]) })},
    ceil: {params: 1, func: p => ({ val: Math.ceil(p[0]) })},
    floor: {params: 1, func: p => ({ val: Math.floor(p[0]) })},
    
    cos: {params: 1, func: p => ({ val: Math.cos(p[0]) })},
    cosh: {params: 1, func: p => ({ val: Math.cosh(p[0]) })},
    acos: {params: 1, func: p => ({ val: Math.acos(p[0]) })},
    acosh: {params: 1, func: p => ({ val: Math.acosh(p[0]) })},
    
    sin: {params: 1, func: p => ({ val: Math.sin(p[0]) })},
    sinh: {params: 1, func: p => ({ val: Math.sinh(p[0]) })},
    asin: {params: 1, func: p => ({ val: Math.asin(p[0]) })},
    asinh: {params: 1, func: p => ({ val: Math.asinh(p[0]) })},
    
    tan: {params: 1, func: p => ({ val: Math.tan(p[0]) })},
    tanh: {params: 1, func: p => ({ val: Math.tanh(p[0]) })},
    atan: {params: 1, func: p => ({ val: Math.atan(p[0]) })},
    atan2: {params: 2, func: p => ({ val: Math.atan2(p[0], p[1]) })},
    atanh: {params: 1, func: p => ({ val: Math.atanh(p[0]) })},
    
    log: {params: 1, func: p => ({ val: Math.log(p[0]) })},
    log10: {params: 1, func: p => ({ val: Math.log10(p[0]) })},
    log2: {params: 1, func: p => ({ val: Math.log2(p[0]) })},
    
    looselyequals: {params: 2, func: p => ({ val: p[0] == p[1] })},
    equals: {params: 2, func: p => ({ val: p[0] === p[1] })},
    greater: {params: 2, func: p => ({ val: p[0] > p[1] })},
    less: {params: 2, func: p => ({ val: p[0] < p[1] })},
    
    not: {params: 1, func: p => ({ val: !p[0] })},
    and: {params: 2, func: p => ({ val: p[0] && p[1] })},
    or: {params: 2, func: p => ({ val: p[0] || p[1] })},
    
    number: {params: 1, func: p => ({ val: Number(p[0]) })},
    string: {params: 1, func: p => ({ val: p[0].toString() })},
  };
  const exec = (vars, cmd, params) => {
    const c = commands[cmd.toString()];
    if (!c) return commands["error"].func(["Command \"" + cmd + "\" Not Found."]);
    debug("executing", cmd.toString());
    debug("vars", vars);
    debug("prejoin", params);
    let paramsstr = params.join(" ");
    debug("postjoin", paramsstr);
    for (const [k, v] of Object.entries(vars)) {
      paramsstr = paramsstr.replaceAll("-".concat(k), v);
    };
    debug("presplit", paramsstr);
    params = paramsstr.split(" ");
    debug("postsplit", params);
    debug("preincmd", params);
    const cmdlog = [];
    let variables = {};
    let parsedparams = [];
    let incmdstop = false;
    let hasincmd = false;
    for (let i = 0; i < params.length; i++) {
      debug("params", params);
      if (params[i] === null || !params[i].startsWith("-")) continue;
      let newparams = params;
      newparams[i] = newparams[i].substring(1);
      if (!Object.hasOwn(commands, newparams[i])) continue;
      hasincmd = true;
      const incmd = commands[newparams[i]];
      const incmdparams = [];
      const tempparams = newparams;
      for (let j = 1; j <= incmd.params && i + j < newparams.length; j++) {
        incmdparams.push(newparams[i + j]);
        tempparams[i + j] = null;
      };
      debug("preincmdexec", incmdparams);
      const out = exec(vars, newparams[i], incmdparams);
      debug("incmdout", out);
      out.log.forEach(v => cmdlog.push(v));
      for (const [k, v] of Object.entries(out.vars)) {
        variables[k] = v;
      };
      incmdstop = out.stop;
      tempparams[i] = out.val;
      
      tempparams.forEach(el => {if (el !== null) parsedparams.push(el)});
    };
    if (!hasincmd) parsedparams = params;
    debug("postincmd", parsedparams);
    let cmdout = c.func(parsedparams);
    if (cmdout.log !== undefined) cmdlog.push(cmdout.log);
    // bandaid for incmds not being able to halt execution
    if (incmdstop) cmdout.stop = true;
    cmdout.val ??= true;
    cmdout.vars ??= [];
    cmdout.log = cmdlog;
    cmdout.stop ??= false;
    debug("cmdoutvar", cmdout.var);
    if (cmdout.vars.length >= 2 && cmdout.vars[0] !== undefined && cmdout.vars[1] !== undefined) {
      variables[cmdout.vars[0]] = cmdout.vars[1];
    };
    cmdout.vars = variables;
    debug("cmdout", cmdout);
    return cmdout;
  };
  const clean = (arr) => {
    if (!arr || !Array.isArray(arr)) return [];
    const result = [];
    arr.forEach(el => {
      if (el) {
        let trimmed = el.toString().trim();
        if (trimmed
          && !trimmed.startsWith("//")
          && !trimmed.startsWith("/*")
          && !trimmed.startsWith("--")
        ) result.push(trimmed);
      };
    });
    return result;
  };
  const parseArray = (arr) => {
    /* Trim, remove blank lines, remove comments, and parse.      *
     * When accepting values, first check if it’s a variable, if  *
     * not, then take it literally. ANYTHING can be the name of a *
     * variable, so be careful! When printing, warning, and       *
     * erroring, add the values to an array, and return it as a   *
     * “log” and the end of program.                              */
    if (!Array.isArray(arr)) throw new Error("expected an array");
    const log = [];
    let vars = {"VERSION": version, "LANG": "javascript"};
    const lines = clean(arr);
    for (const line of lines) {
      const params = line.split(" ");
      const cmd = params.shift();
      const out = exec(vars, cmd, params);
      if (out.log !== undefined) {
        if (Array.isArray(out.log)) {
          out.log.forEach(v => {
            if (v !== undefined) log.push(v);
          });
        } else log.push(out.log);
      };
      for (const [k, v] of Object.entries(out.vars)) {
        vars[k] = v;
      };
      if (out.stop === true) break;
    };
    return log.length > 0 ? log : ["0,no output"];
  };
  const parse = (code) => {
    if (typeof (code) === "string") {
      return parseArray(code.split("\n"));
    } else if (Array.isArray(code)) {
      return parseArray(code);
    } else throw new Error("expected string or array");
  };
  return { parse, parseArray };
})();

/* test */

/**
 * expected output (v1.1.0)
 *
 * - when I say str it is text
 * - when I prefix it with a dash, it is hello, world!
 * - cool test!
 * - version: 1.1.0, lang: javascript
 * - 3 is 3!!!
 * - wow look double  spaces!
 * - you should see this message, and then "true" (default output of function)
 * - true
 * - EXECUTION HALTED: lol
**/
EEL.parse(`
// single-line comment
/* also single-line comment :(
-- more single-line comment
set str hello, world!
print when I say str it is text
print when I prefix it with a dash, it is -str
print -set testing cool test!
print version: -VERSION, lang: -LANG
print -add 1 2 is 3!!!
print wow look double  spaces!
print -print you should see this message, and then "true" (default output of functions)
stop lol
/* doesnt run
print 2
`).forEach(log => {
  if (log.startsWith("0,")) console.log(log.replace("0,", ""));
  if (log.startsWith("1,")) console.log("WARNING: ".concat(log.replace("1,", "")));
  if (log.startsWith("2,")) console.log("ERROR: ".concat(log.replace("2,", "")));
  if (log.startsWith("3,")) console.log("EXECUTION HALTED: ".concat(log.replace("3,", "")));
});
