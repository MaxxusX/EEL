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
   * Scope doesn't exist. Variable names can only contain dashes,
   * underscores, and alphanumeric characters. Variables cannot
   * be destroyed, but they can always be overwritten. Null and
   * Undefined values don’t exist. The only type is "string".
   * I'm not joking. When modifying this source code, remember to
   * use toNumber. "~=" exists because there's probably some
   * annoying "feature" that needs a hacky bandaid. When accessing
   * variables or using a function inside a function, prefix the
   * name with a dash (-) unless it's an operator (eg. "++").
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
   *
   *
   * Ranges are ALWAYS inclusive, this means the range 1,7 is between
   * 1 and 7 INCLUDING 1 and 7.
  **/
  
  const version = "0.13.1";
  const debugging = true;
  
  const debug = !debugging ? (() => true) : ((...txt) => console.log(...txt));
  
  const clean = (arr) => {
    if (!arr || !Array.isArray(arr)) return [];
    const result = [];
    
    arr.forEach(el => {
      el ??= "";
      if (el !== "") {
        const trimmed = String(el).trim();
        if (trimmed !== "") result.push(trimmed);
      };
    });
    
    return result;
  };
  
  const isnullish = (val) => {
    return val === undefined || val === null;
  };
  
  /**
   * Use this instead of =. Running "let a = b"
   * sets "a" to a *reference* of "b", not a copy.
   * That means all changes to "a" affect "b".
   * This also converts everything to a string!!!!
   * side effect; it also removes undefined & null
  **/
  const copyparams = (arr) => {
    if (!arr || !Array.isArray(arr)) return [];
    const result = [];
    
    arr.forEach(el => {
      if (!isnullish(el)) result.push(String(el));
    });
    
    return result;
  };
  
  const clog = (ty, tx, ln) => ({
    "type": String(ty ?? "0"),
    "text": isnullish(tx) ? undefined : String(tx),
    "line": String(ln ?? "?"),
    
    get string() {
      this.text = isnullish(this.text) ? undefined : String(tx);
      this.type = String(this.type ?? "0");
      this.line = String(this.line ?? "?");
      if (this.text === undefined) return undefined;
      return `${String(this.type)},${String(this.line)};${String(this.text)}`
    },
  });
  
  // { log, stop, val, vars }
  const cout = (obj) => {
    let safevars = obj?.vars ?? [];
    if (isnullish(safevars[0]) || isnullish(safevars[1])) {
      safevars = [];
    };
    
    return {
      "log": obj?.log ?? undefined,
      "stop": obj?.stop ?? false,
      "val": String(obj?.val ?? "true"),
      "vars": safevars,
    };
  };
  
  const errornames = {
    "bad-var-name": "Invalid variable name; expected alphanumeric string, received \"$v\"",
    "cmd-not-found": "Command \"$v\" does not exist",
    "internal-error": "INTERNAL ERROR: $v",
  };
  const geterr = (name, v) => cout({
    log: clog(2, errornames[name].replace("$v", String(v))),
    stop: true,
    val: "false",
    vars: [],
  });
  
  const commands = {
    /** DOCS
     * COMMAND FORMAT
     * name: {params: number, func: arrOfParameters => function}
     *
     * COMMAND OPTIONS (* means required)
     * skip: if true, immediately skips to the next line without executing anything, itself included. (can omit required options, default: false)
     * * params: the number of params the command takes
     * * func: a function, passed an array of parameters. must return an output created with cout()
     * operator: if the function is an operator, eg ++ or **. (default: false)
     *
     *
     * COUT PARAMETERS
     * an object with any/none/all of the following values:
     *
     * log: the log/console output of the command. expects a value made w/ clog(), or undefined (default: undefined)
     * val: return value of command (default: "true")
     * vars: sets variable of name vars[0] to value vars[1]. expects an array with 0 or 2 values (default: [])
     * stop: if the program should stop after the command finishes (default: false)
    **/
    
    // Comments
    "#": {skip: true, params: Infinity, func: p => cout({ val: "" })},
    "/*": {skip: true, params: Infinity, func: p => cout({ val: "" })},
    "--": {skip: true, params: Infinity, func: p => cout({ val: "" })},
    
    // Log
    print: {params: Infinity, func: p => cout({ log: clog(0, p.join(" ")) })},
    warn: {params: Infinity, func: p => cout({ log: clog(1, p.join(" ")) })},
    error: {params: Infinity, func: p => cout({ log: clog(2, p.join(" ")), stop: true })},
    
    // Flow
    stop: {params: Infinity, func: p => cout({ log: clog(3, p.join(" ")), stop: true })},
    
    // Variables
    set: {params: Infinity, func: p => {
      const name = p.shift();
      
      // only allow alphanumeric, underscore, and dash
      if (!/^[\w-]+$/.exec(name)) return geterr("bad-var-name", name);
      
      const value = p.join(" ");
      
      return cout({ vars: [name, value], val: value });
    }},
    
    // Math
    "++": {operator: true, params: 2, func: p => cout({ val: Number(p[0]) + Number(p[1]) })},
    "--": {operator: true, params: 2, func: p => cout({ val: Number(p[0]) - Number(p[1]) })},
    "**": {operator: true, params: 2, func: p => cout({ val: Number(p[0]) * Number(p[1]) })},
    // TODO: "//" is already used for comments. Don’t complain; I won’t fix it.
    // TODO: nvm
    "//": {operator: true, params: 2, func: p => cout({ val: Number(p[0]) / Number(p[1]) })},
    "^^": {operator: true, params: 2, func: p => cout({ val: Number(p[0]) ^ Number(p[1]) })},
    
    min: {params: 2, func: p => cout({ val: Math.min(Number(p[0]), Number(p[1])) })},
    max: {params: 2, func: p => cout({ val: Math.max(Number(p[0]), Number(p[1])) })},
    // (num, min, max) INCLUSIVE; eg. (10,1,7) returns 7, not 6.
    clamp: {params: 3, func: p => cout({ val: Math.min(Math.max(Number(p[0]), Number(p[1])), Number(p[2])) })},
    
    sqrt: {params: 1, func: p => cout({ val: Math.sqrt(p[0]) })},
    cbrt: {params: 1, func: p => cout({ val: Math.cbrt(p[0]) })},
    
    abs: {params: 1, func: p => cout({ val: Math.abs(p[0]) })},
    ceil: {params: 1, func: p => cout({ val: Math.ceil(p[0]) })},
    floor: {params: 1, func: p => cout({ val: Math.floor(p[0]) })},
    round: {params: 1, func: p => cout({ val: Math.round(p[0]) })},
    
    cos: {params: 1, func: p => cout({ val: Math.cos(p[0]) })},
    cosh: {params: 1, func: p => cout({ val: Math.cosh(p[0]) })},
    acos: {params: 1, func: p => cout({ val: Math.acos(p[0]) })},
    acosh: {params: 1, func: p => cout({ val: Math.acosh(p[0]) })},
    
    sin: {params: 1, func: p => cout({ val: Math.sin(p[0]) })},
    sinh: {params: 1, func: p => cout({ val: Math.sinh(p[0]) })},
    asin: {params: 1, func: p => cout({ val: Math.asin(p[0]) })},
    asinh: {params: 1, func: p => cout({ val: Math.asinh(p[0]) })},
    
    tan: {params: 1, func: p => cout({ val: Math.tan(p[0]) })},
    tanh: {params: 1, func: p => cout({ val: Math.tanh(p[0]) })},
    atan: {params: 1, func: p => cout({ val: Math.atan(p[0]) })},
    atan2: {params: 2, func: p => cout({ val: Math.atan2(p[0], p[1]) })},
    atanh: {params: 1, func: p => cout({ val: Math.atanh(p[0]) })},
    
    log: {params: 1, func: p => cout({ val: Math.log(p[0]) })},
    log10: {params: 1, func: p => cout({ val: Math.log10(p[0]) })},
    log2: {params: 1, func: p => cout({ val: Math.log2(p[0]) })},
    
    // RNG
    random: {params: 0, func: () => cout({ val: Math.random() })},
    randomint: {params: 2, func: p => {
      // INCLUSIVE; eg. (1,7) could return 1-7 INCLUDING 1 and 7
      const min = Math.floor(Math.min(Number(p[0]), Number(p[1])));
      const max = Math.floor(Math.max(Number(p[0]), Number(p[1])) + 1);
      return cout({ val: Math.floor(Math.random() * (max - min)) + min });
    }},
    
    // Comparison
    "~=": {operator: true, params: 2, func: p => cout({ val: p[0] == p[1] })},
    "==": {operator: true, params: 2, func: p => cout({ val: p[0] === p[1] })},
    ">>": {operator: true, params: 2, func: p => cout({ val: p[0] > p[1] })},
    "<<": {operator: true, params: 2, func: p => cout({ val: p[0] < p[1] })},
    
    // Logic Gates
    not: {params: 1, func: p => cout({ val: !p[0] })},
    "&&": {operator: true, params: 2, func: p => cout({ val: p[0] && p[1] })},
    "||": {operator: true, params: 2, func: p => cout({ val: p[0] || p[1] })},
    
    // idk
    join: {params: 2, func: p => cout({ val: String(p[0]).concat(String(p[1])) })},
  };
  
  const runcmd = (cte, params) => {
    const cmd = String(cte);
    const c = commands?.[cmd];
    
    if (c === undefined) return geterr("cmd-not-found", cmd);
    if (c?.skip === true) return cout(undefined, false, "", []);
    
    // copyparams has to remove null & undefined, so we'll take advantage of that
    return c.func(copyparams(params ?? []));;
  };
  
  const exec = (vars, cte, prms) => {
    const cmd = String(cte);
    const c = commands[cmd];
    
    if (c?.skip === true) return undefined;
    if (!c) return geterr("cmd-not-found", cmd);
    
    let params = copyparams(prms);
    
    debug("executing", cmd);
    debug("prevar", params);
    
    // replaced: "-hi", " -hi", "-hi,", "-hi-there"
    // not replaced: "a-hi", "-uh#oh", "-not-a-variable-name"
    params = params.map(v => v.replaceAll(/(?:\s|^)-([\w-]+)/g, (og, name) => vars[name] ?? og));
    
    debug("preincmd", params);
    
    const cmdlog = [];
    let variables = {};
    let parsedparams = copyparams(params);
    let incmdstop = false;
    
    for (let i = 0; i < parsedparams.length; i++) {
      debug("incmd: idx", i, parsedparams[i]);
      if (isnullish(parsedparams[i])) {
        /**
         * when a command executes, it replaces itself with its output, and
         * replaces its parameters with null, but it cannot remove its parameters
         * so if we don’t manually remove them and restart the check, we’ll
         * accidentally pass null to other commands, which messes things up
         *
         * ^ the above situation only happens in 2+ layer command recursion
         * eg "print 1 ++ 2 ** 2" which means print(multiply(add(1, 2), 2))
        **/
        debug("incmd: null detected; restarting", i);
        parsedparams = copyparams(parsedparams);
        i = -1;
        continue;
      };
      
      let newparams = copyparams(parsedparams);
      
      if (i+2 < newparams.length) {
        const nextc = commands?.[newparams[i+1]];
        
        if (!isnullish(nextc) && nextc?.operator === true) {
          if (nextc?.skip === true || commands?.[newparams[i+2]]?.skip === true) return undefined;
          
          debug("operation", newparams[i], newparams[i+1], newparams[i+2]);
          
          const out = exec(vars, newparams[i+1], [newparams[i], newparams[i+2]]);
          out.log.forEach(v => cmdlog.push(v));
          for (const [k, v] of Object.entries(out.vars)) {
            variables[k] = v;
          };
          incmdstop = out.stop;
          
          newparams[i] = out.val;
          newparams[i+1] = null;
          newparams[i+2] = null;
          
          parsedparams = copyparams(newparams);
          debug("parsedparams", parsedparams);
          
          // TODO: whenever it executes an operation, it should move back 1, apparently this crashes it?
          // move back by 2 to move back by 1, because continue increases i by 1
          i -= 1;
          continue;
        };
      };
      
      if (!newparams[i].startsWith("-")) continue;
      
      newparams[i] = newparams[i].substring(1);
      
      const incmd = commands?.[newparams[i]];
      
      if (isnullish(incmd) || incmd.operator || incmd?.skip === true) continue;
      
      const incmdparams = [];
      const tempparams = copyparams(newparams);
      
      for (let j = i+1; j <= incmd.params+i; j++) {
        if (j >= newparams.length) break;
        debug("paramindex", j);
        incmdparams.push(tempparams[j]);
        tempparams[j] = null;
      };
      
      const out = exec(vars, newparams[i], incmdparams);
      out.log.forEach(v => cmdlog.push(v));
      
      for (const [k, v] of Object.entries(out.vars)) {
        variables[k] = v;
      };
      incmdstop = out.stop;
      tempparams[i] = out.val;
      
      parsedparams = copyparams(tempparams);
      debug("parsedparams", parsedparams);
    };
    
    debug("postincmd", parsedparams);
    
    let cmdout = runcmd(cmd, parsedparams);
    if (cmdout.log !== undefined) cmdlog.push(cmdout.log);
    if (cmdout.vars.length > 1) {
      variables[cmdout.vars[0]] = cmdout.vars[1];
    };
    
    let output = {
      stop: incmdstop || cmdout.stop, // false
      val: cmdout.val, // true
      log: cmdlog, // []
      vars: variables, // {}
    };
    
    debug("output", output);
    return output;
  };
  
  const parseArray = (arr) => {
    /* Trim, remove blank lines, and parse.                       *
     * When accepting values, first check if it’s a variable, if  *
     * not, then take it literally. ANYTHING can be the name of a *
     * variable, so be careful! When printing, warning, and       *
     * erroring, add the values to an array, and return it as a   *
     * “log” and the end of program.                              */
    
    if (!Array.isArray(arr)) throw new Error("expected an array");
    
    const log = [];
    let vars = {"VERSION": version, "LANG": "javascript", "MAX": Number.MAX_SAFE_INTEGER};
    const lines = clean(arr);
    
    try {
      for (const line of lines) {
        const params = line.split(" ");
        const cmd = params.shift();
        const out = exec(vars, cmd, params) ?? undefined;
        
        if (out === undefined) continue;
        
        out.log.forEach(v => log.push(v))
        for (const [k, v] of Object.entries(out.vars)) {
          vars[k] = v;
        };
        if (out.stop) break;
      };
    } catch (e) {log.push(geterr("internal-error", e))};
    
    return log;
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
      "# a",
      "/* b",
      "-- c",
      "set d h i, world",
      "print a d b",
      "print a -d b",
      "print -set t a b",
      "print v -VERSION l -LANG",
      "print 1 ++ 2 is 3",
      "print a  b",
      "print -print a b",
      "print -clamp 9 1 7",
      "print 1 << 2",
      "print 1+2*2 is 6",
      "print 5 == 5",
      "print 5 == 6",
      "print -min 1 2 one",
      "print h -min 1 2",
      "print -clamp 10 -min 1 2 -max 7 4",
      "stop lol",
      "print 2",
    ]);
    const correct = [{"type":"0","text":"a d b","line":"?","string":"0,?;a d b"},{"type":"0","text":"a h i, world b","line":"?","string":"0,?;a h i, world b"},{"type":"0","text":"a b","line":"?","string":"0,?;a b"},{"type":"0","text":"v 0.13.1 l javascript","line":"?","string":"0,?;v 0.13.1 l javascript"},{"type":"0","text":"3 is 3","line":"?","string":"0,?;3 is 3"},{"type":"0","text":"a  b","line":"?","string":"0,?;a  b"},{"type":"0","text":"a b","line":"?","string":"0,?;a b"},{"type":"0","text":"true","line":"?","string":"0,?;true"},{"type":"0","text":"7","line":"?","string":"0,?;7"},{"type":"0","text":"true","line":"?","string":"0,?;true"},{"type":"0","text":"1+2*2 is 6","line":"?","string":"0,?;1+2*2 is 6"},{"type":"0","text":"true","line":"?","string":"0,?;true"},{"type":"0","text":"false","line":"?","string":"0,?;false"},{"type":"0","text":"1 one","line":"?","string":"0,?;1 one"},{"type":"0","text":"h 1","line":"?","string":"0,?;h 1"},{"type":"0","text":"7","line":"?","string":"0,?;7"},{"type":"3","text":"lol","line":"?","string":"3,?;lol"}];
    
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
  "print uh 1 ++ 2 ** 2 is 6 cuz we ignore pemdas",
  "print -min 1 2 one",
  "print h -min 1 2",
  "# broken",
  "print -clamp 10 -min 1 2 -max 7 4",
  "print 7 == 7",
  "print hello == hello",
]).forEach(l => console.log(l.string));
