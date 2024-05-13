"use strict";

/**
 * Easily Extendable Language
 * Copyright (c) 2024 Maxxus
 * MIT License (https://opensource.org/license/mit)
**/

const EEL = (() => {
  const version = "0.0.2"; /* temp!! i lost the updated version */ 

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
     * stop is if the program should stop (default: false)
    **/

    print: {params: 2^52, func: p => ({ log: "0," + p.join(" ") })},
    warn: {params: 2^52, func: p => ({ log: "1," + p.join(" ") })},
    error: {params: 2^52, func: p => ({ log: "2," + p.join(" "), stop: true })},
    stop: {params: 2^52, func: p => ({ log: "3," + p.join(" "), stop: true })},
    add: {params: 2, func: p => ({ val: p[0] + p[1] })},
    sub: {params: 2, func: p => ({ val: p[0] - p[1] })},
    mul: {params: 2, func: p => ({ val: p[0] * p[1] })},
    div: {params: 2, func: p => ({ val: p[0] / p[1] })},
    pow: {params: 2, func: p => ({ val: p[0] ^ p[1] })},
    equals: {params: 2, func: p => ({ val: p[0] === p[1] })},
    not: {params: 1, func: p => ({ val: !p[0] })},
  };

  const exec = (vars, cmd, params) => {
    const c = commands[cmd.toString()];

    if (!c) return commands["error"]([combine("Command \"", cmd, "\" Not Found.")]);

    for (let [k, v] of Object.entries(vars)) {
      for (let i = 0; i < params.length; i++) {
        if (params[i].toString() === k) params[i] = v;
      };
    };

    for (let i = 0; i < params.length; i++) {
      const incmd = commands[params[i]];
      if (!incmd) continue;
      const incmdparams = [];
      for (let j = 1; j < incmd.params; j++) {
        incmdparams.push(params[i + j]);
        params[i + j] = null;
      };

      const fn = incmd.func(incmdparams);
      console.log(fn);
      const val = fn.val;
      params[i] = val !== null ? val : true;
    };

    return c.func(params);
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
    const vars = {"_VERSION": version, "_LANG": "javascript"};
    const lines = clean(arr);

    for (const line of lines) {
      const params = line.split(" ");
      const cmd = params.shift();
      const out = exec(vars, cmd, params);
      /* return val is out.val */
      if (out.log !== undefined) log.push(out.log);
      if (out.stop === true) break;
    };

    return log.length > 0 ? log : ["0,no output"];
  };

  const parse = (code) => {
    if (typeof (code) === "string") {
      return parseArray(code.split("\n"));
    } else if (Array.isArray(code)) {
      return parseArray(code);
    } else {
      throw new Error("expected string or array");
    };
  };

  return { parse, parseArray };
})();

EEL.parse(`
// single-line comment
/* also single-line comment :(
-- more single-line comment
-- set str hello, world!
-- set num 1
print str
print num
// this should print "3 is 3!!!"
print add 1 2 is 3!!!
// "Execution Halted: lol"
stop lol
// doesnt run
print 2
`).forEach(log => {
  if (log.startsWith("0,")) console.log(log.replace("0,", ""));
  if (log.startsWith("1,")) console.log("WARNING: ".concat(log.replace("1,", "")));
  if (log.startsWith("2,")) console.log("ERROR: ".concat(log.replace("2,", "")));
  if (log.startsWith("3,")) {
    const comment = log.replace("3,", "");
    console.log(comment ? "Execution Halted: ".concat(comment) : "Execution Halted.");
  };
});
