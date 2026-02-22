const globals = require("globals");

/**
 * Shared ESLint flat config for the utils.live monorepo.
 *
 * This exports an array of flat config objects that can be spread
 * into any eslint.config.mjs file.
 *
 * @type {import('eslint').Linter.Config[]}
 */
module.exports = [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];
