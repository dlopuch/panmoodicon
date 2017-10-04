const airBnbStyle = require('eslint-config-airbnb-base/rules/style');
const airBnbVars = require('eslint-config-airbnb-base/rules/variables');

// Allow no-indent method chaining
let indentOverride = airBnbStyle.rules.indent;
indentOverride[2].MemberExpression = 0;

// Express uses method parity... often require unused args.  At least force standard names
let noUnusedVars = airBnbVars.rules['no-unused-vars'];
// should be it, but not working:  noUnusedVars[1].varsIgnorePattern = 'next';
noUnusedVars[1].args = 'none';

module.exports = {
  "extends": "airbnb-base",

  "env": {
    "browser": true,
  },

  // Sketchpack overrides from AirBNB
  "rules": {

    // These are sketches.  Console debugging is okay.
    "no-console": 0,

    "max-len": ["error", 140],

    // disagreements with airbnb:
    "func-names": 0,
    "prefer-arrow-callback": 0,
    "no-shadow": 0,
    "prefer-const": 0,
    "no-underscore-dangle": 0,
    "no-continue": 0, // no guard-clauses airbnb? for realsies?
    "newline-per-chained-call": 0, // not appropriate for D3
    "key-spacing": 0, // I like making columns
    "comma-spacing": 0, // I like making columns
    "space-before-function-paren": 0, // don't like that style
    "no-param-reassign": ["error", {"props": false} ], // let forEach's mutate objects
    "no-return-assign": ["error", "except-parens"], // Good rule, but creates confusion with arrow functions https://github.com/eslint/eslint/issues/5150
    "function-paren-newline": 0,
    "indent": indentOverride,
    "no-unused-vars": noUnusedVars,
  }
};