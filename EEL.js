const EEL = (() => {
  "use strict";
  
  /**
   * Easily Extendable Language
   * Copyright (c) 2024 Maxxus
   * MIT License (https://opensource.org/license/mit)
   *
   *
   *
   * This language is a bit different than what you're used to.
   * Scope doesn't exist. Anything (excluding spaces) can be a
   * variable. Variables cannot be destroyed, but they can always
   * be overwritten. Null and Undefined values don’t exist. The
   * only type is "string". I'm not joking. When modifying this
   * source code, remember to use toNumber. the "number", "string",
   * and "looselyequals" commands exist because there's probably
   * some annoying "feature" that needs a hacky bandaid. When
   * accessing variables or using a function inside a function,
   * prefix the name with a dash (-).
   *
   *
   * EEL.parse() takes a string or array of your code, it returns the 
   * output of the program in an array. Each item in the array starts
   * with a one digit number (0-3), followed by a comma, and then the
   * actual output. Their meanings are as follows:
   *
   * 0, = print
   * 1, = warning
   * 2, = error (stops program)
   * 3, = execution halted (stops program) (for when you run stop())
   *
   * You can ignore these if you want by just using substring(2) on
   * every item in the log, or you can detect the log type and style 
   * your output!
  **/
  
  const version = "2.0.1";
  const debugging = true;
  
  const debug = !debugging ? (() => true) : ((...txt) => console.log(...txt))
  const inf = Number.MAX_SAFE_INTEGER;
  const clean = (arr) => {
    if (!arr || !Array.isArray(arr)) return [];
    const result = [];
    arr.forEach(el => {
      if (el) {
        const trimmed = el.toString().trim();
        if (trimmed) result.push(trimmed);
      };
    });
    return result;
  };
  const removecomments = (arr) => {
    if (!arr || !Array.isArray(arr)) return [];
    const result = [];
    clean(arr).forEach(el => {
      if (!el.startsWith("//")
       && !el.startsWith("/*")
       && !el.startsWith("--")
      ) result.push(el);
    });
    return result;
  };
  /**
   * Use this instead of =. Running "let a = b"
   * sets "a" to a *reference* of "b", not a copy.
   * That means all changes to "a" affect "b".
  **/
  const clonearray = (arr) => {
    if (!arr || !Array.isArray(arr)) return [];
    const result = [];
    arr.forEach(el => result.push(el));
    return result;
  };
  const commands = {
    /**
     * log is what to output into the log (default: undefined (no log))
     * val is what the command returns (default: true)
     * vars is new variables (default: {})
     * stop is if the program should stop (default: false)
    **/
    
    // Log
    print: {params: inf, func: p => ({ log: "0," + p.join(" ") })},
    warn: {params: inf, func: p => ({ log: "1," + p.join(" ") })},
    error: {params: inf, func: p => ({ log: "2," + p.join(" "), stop: true })},
    
    // Flow
    stop: {params: inf, func: p => ({ log: "3," + p.join(" "), stop: true })},
    // TODO: this is trash and freezes ur browser until it's done waiting
    /**
     * wait: {params: 1, func: p => {
     *   const end = Date.now() + Math.floor(Number(p[0]) * 1000);
     *   while (Date.now() < end) continue;
     * }},
    **/
    
    // Variables
    set: {params: inf, func: p => ({ vars: [p.shift(), p.join(" ")], val: p.join(" ")})},
    
    // Math
    "++": {operator: true, params: 2, func: p => ({ val: Number(p[0]) + Number(p[1]) })},
    "--": {operator: true, params: 2, func: p => ({ val: Number(p[0]) - Number(p[1]) })},
    "**": {operator: true, params: 2, func: p => ({ val: Number(p[0]) * Number(p[1]) })},
    // TODO: "//" is already used for comments. Don’t complain; I won’t fix it.
    "-/": {operator: true, params: 2, func: p => ({ val: Number(p[0]) / Number(p[1]) })},
    "^^": {operator: true, params: 2, func: p => ({ val: Number(p[0]) ^ Number(p[1]) })},
    
    min: {params: 2, func: p => ({ val: Math.min(Number(p[0]), Number(p[1])) })},
    max: {params: 2, func: p => ({ val: Math.max(Number(p[0]), Number(p[1])) })},
    // (num, min, max) INCLUSIVE; eg. (10,1,7) returns 7, not 6.
    clamp: {params: 3, func: p => ({val: Math.min(Math.max(Number(p[0]), Number(p[1])), Number(p[2]))})},
    
    sqrt: {params: 1, func: p => ({ val: Math.sqrt(p[0]) })},
    cbrt: {params: 1, func: p => ({ val: Math.cbrt(p[0]) })},
    
    abs: {params: 1, func: p => ({ val: Math.abs(p[0]) })},
    ceil: {params: 1, func: p => ({ val: Math.ceil(p[0]) })},
    floor: {params: 1, func: p => ({ val: Math.floor(p[0]) })},
    round: {params: 1, func: p => ({ val: Math.round(p[0]) })},
    
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
    
    // RNG
    random: {params: 0, func: () => ({ val: Math.random() })},
    randomint: {params: 2, func: p => {
      // INCLUSIVE; eg. (1,7) could return 1-7 INCLUDING 1 and 7
      const min = Math.floor(Math.min(Number(p[0]), Number(p[1])));
      const max = Math.floor(Math.max(Number(p[0]), Number(p[1])) + 1);
      return {val: Math.floor(Math.random() * (max - min)) + min};
    }},
    
    // Comparison
    "~=": {operator: true, params: 2, func: p => ({ val: p[0] == p[1] })},
    "==": {operator: true, params: 2, func: p => ({ val: p[0] === p[1] })},
    ">>": {operator: true, params: 2, func: p => ({ val: p[0] > p[1] })},
    "<<": {operator: true, params: 2, func: p => ({ val: p[0] < p[1] })},
    
    // Logic Gates
    not: {params: 1, func: p => ({ val: !p[0] })},
    "&&": {operator: true, params: 2, func: p => ({ val: p[0] && p[1] })},
    "||": {operator: true, params: 2, func: p => ({ val: p[0] || p[1] })},
    
    // "Types"
    unnan: {params: 2, func: p => {
      const num = Number(p[0]);
      return {val: Number.isNaN(num) ? Number(p[1]) : num};
    }},
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
    debug("preincmd", params);
    const cmdlog = [];
    let variables = {};
    let parsedparams = [];
    let incmdstop = false;
    let hasincmd = false;

    for (let i = 0; i < params.length; i++) {
      if (params[i] === null) {
        /**
         * when a command executes, it replaces itself with its output, and
         * replaces its parameters with null, but it cannot remove its parameters
         * so if we don’t manually remove them and restart the check, we’ll
         * accidentally pass null to other commands, which messes things up
         *
         * ^ the above situation only happens in 2+ layer command recursion
         * eg "print 1 ++ 2 ** 2" which means print(multiply(add(1, 2), 2))
        **/
        params = clean(params);
        i = -1;
        continue;
      };
      let newparams = clonearray(params);
      if (!newparams[i].startsWith("-") && !(commands[newparams[i]] ?? {}).operator) {
        continue;
      } else if (newparams[i].startsWith("-") && newparams[i].length > 1) {
        newparams[i] = newparams[i].substring(1);
      };
      if (!Object.hasOwn(commands, newparams[i])) continue;
      hasincmd = true;
      const incmd = commands[newparams[i]];
      const incmdparams = [];
      const tempparams = clonearray(newparams);
      const incmdshift = incmd.operator ? 1:0;

      // TODO: This is broken, pls fix.
      for (let j = 0 /* 1 */; j <= incmd.params /* + incmdshift */; j++) {
        const paramindex = i + j - incmdshift;
        if (paramindex >= newparams.length) break;
        if (paramindex === i) continue;
        debug("paramindex", paramindex);
        incmdparams.push(tempparams[paramindex]);
        tempparams[paramindex] = null;
      };

      const out = exec(vars, newparams[i], incmdparams);
      out.log.forEach(v => cmdlog.push(v));
      for (const [k, v] of Object.entries(out.vars)) {
        variables[k] = v;
      };
      incmdstop = out.stop;
      tempparams[i] = out.val;
      debug("tempparams", tempparams);
      parsedparams = clonearray(tempparams);
      // tempparams.forEach(el => {if (el !== null) parsedparams.push(el)});
      debug("parsedparams", parsedparams);
    };
    if (!hasincmd) parsedparams = params;

    const temporary = clonearray(parsedparams);
    parsedparams = [];
    temporary.forEach(el => {if (el !== null) parsedparams.push(el)});

    debug("postincmd", parsedparams);
    let cmdout = c.func(parsedparams);
    if (cmdout.log !== undefined) cmdlog.push(cmdout.log);
    // bandaid for incmds not being able to halt execution
    if (incmdstop) cmdout.stop = true;
    cmdout.val ??= "true";
    cmdout.val = cmdout.val.toString();
    cmdout.vars ??= [];
    cmdout.log = cmdlog;
    cmdout.stop ??= false;
    if (cmdout.vars.length >= 2 && cmdout.vars[0] !== undefined && cmdout.vars[1] !== undefined) {
      variables[cmdout.vars[0]] = cmdout.vars[1];
    };
    cmdout.vars = variables;
    debug("cmdout", cmdout);
    return cmdout;
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
    let vars = {"VERSION": version, "LANG": "javascript", "MAX": inf};
    const lines = removecomments(arr);
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
  
  const test = () => {
    let passed = true;
    const parsed = parse([
      "// single-line comment",
      "/* also single-line comment :(",
      "-- more single-line comment",
      "set str hello, world!",
      "print when I say str it is text",
      "print when I prefix it with a dash, it is -str",
      "print -set testing cool test!",
      "print version: -VERSION, lang: -LANG",
      "print 1 ++ 2 is 3!!!",
      "print wow look double  spaces!",
      "print -print you should see this message, and then \"true\" (default output of functions)",
      "print -clamp 10 1 7",
      "print 1 << 2",
      "print 1+2*2 prints 6, not 5, cuz we read left to right: 1 ++ 2 ** 2",
      "stop lol",
      "print 2",
    ]);
    const correct = ["0,when I say str it is text", "0,when I prefix it with a dash, it is hello, world!", "0,cool test!", "0,version: " + version + ", lang: javascript", "0,3 is 3!!!", "0,wow look double  spaces!", "0,you should see this message, and then \"true\" (default output of functions)", "0,true", "0,7", "0,true", "0,1+2*2 prints 6, not 5, cuz we read left to right: 6", "3,lol"];
    
    for (let i = 0; i < correct.length; i++) {
      if (parsed[i] !== correct[i]) {
        passed = false;
        debug("test failed on line " + i + ",", test[i], "is not equal to", correct[i]);
      };
    };
    
    debug("testcorrect", correct);
    debug("testparsed", parsed);
    debug("testpassed", passed);
    
    return passed;
  };
  
  return { parse, test };
})();

// console.log("working: " + EEL.test());

// testing
EEL.parse([
  "print 1 ++ 2 is 3!!!",
  "print guh 1 ++ 2 ** 2",
  "print -min 1 2 one",
  "print h -min 1 2",
]).forEach(l => console.log(l));
