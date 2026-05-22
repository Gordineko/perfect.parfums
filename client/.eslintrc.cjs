/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,

  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },

  env: { browser: true, es2021: true, node: true },

  plugins: [
    "@next/next",
    "react",
    "react-hooks",
    "import",
    "boundaries",
    "simple-import-sort",
  ],

  extends: [
    "eslint:recommended",
    "plugin:@next/next/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],

  settings: {
    react: { version: "detect" },

    "import/resolver": {
      alias: {
        map: [
          ["@app", "./src/app"],
          ["@processes", "./src/processes"],
          ["@pages", "./src/pages"],
          ["@widgets", "./src/widgets"],
          ["@features", "./src/features"],
          ["@entities", "./src/entities"],
          ["@shared", "./src/shared"],
        ],
        extensions: [".js", ".jsx"],
      },
    },

    "boundaries/elements": [
      { type: "app", pattern: "src/app/*" },
      { type: "processes", pattern: "src/processes/*" },
      { type: "pages", pattern: "src/pages/*" },
      { type: "widgets", pattern: "src/widgets/*" },
      { type: "features", pattern: "src/features/*" },
      { type: "entities", pattern: "src/entities/*" },
      { type: "shared", pattern: "src/shared/*" },
    ],
  },

  rules: {
    // ====== только публичное API ======
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: [
              "@app/*/*",
              "@processes/*/*",
              "@pages/*/*",
              "@widgets/*/*",
              "@features/*/*",
              "@entities/*/*",
              "@shared/*/*",
            ],
            message:
              "Импортируй только через публичный API сегмента: @layer/Segment (index.js).",
          },
        ],
      },
    ],

    // ====== матрица зависимостей по FSD ======
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          {
            from: "app",
            allow: [
              "processes",
              "pages",
              "widgets",
              "features",
              "entities",
              "shared",
            ],
          },
          {
            from: "processes",
            allow: ["pages", "widgets", "features", "entities", "shared"],
          },
          {
            from: "pages",
            allow: ["widgets", "features", "entities", "shared"],
          },
          { from: "widgets", allow: ["features", "entities", "shared"] },
          { from: "features", allow: ["entities", "shared"] },
          { from: "entities", allow: ["shared"] },
          { from: "shared", allow: ["shared"] },
        ],
      },
    ],

    // ====== учёт JSX-переменных ======
    "no-unused-vars": [
      "error",
      {
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: true,
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
      },
    ],
    "react/jsx-uses-vars": "error",
    "react/react-in-jsx-scope": "off",

    "react/prop-types": "off",

    // ====== сортировка импортов ======
    "import/order": "off",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
  },

  overrides: [
    // entities → нельзя вверх + нельзя глубоко
    {
      files: ["src/entities/**/*.{js,jsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              "@features/*",
              "@widgets/*",
              "@pages/*",
              "@processes/*",
              "@app/*",
              "@app/*/*",
              "@processes/*/*",
              "@pages/*/*",
              "@widgets/*/*",
              "@features/*/*",
              "@entities/*/*",
              "@shared/*/*",
            ],
          },
        ],
      },
    },
    // features → нельзя вверх + нельзя глубоко
    {
      files: ["src/features/**/*.{js,jsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              "@widgets/*",
              "@pages/*",
              "@processes/*",
              "@app/*",
              "@app/*/*",
              "@processes/*/*",
              "@pages/*/*",
              "@widgets/*/*",
              "@features/*/*",
              "@entities/*/*",
              "@shared/*/*",
            ],
          },
        ],
      },
    },
    // widgets → нельзя вверх + нельзя глубоко
    {
      files: ["src/widgets/**/*.{js,jsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              "@pages/*",
              "@processes/*",
              "@app/*",
              "@app/*/*",
              "@processes/*/*",
              "@pages/*/*",
              "@widgets/*/*",
              "@features/*/*",
              "@entities/*/*",
              "@shared/*/*",
            ],
          },
        ],
      },
    },
    // pages → нельзя вверх + нельзя глубоко
    {
      files: ["src/pages/**/*.{js,jsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["../*"],
                message:
                  "Запрещены относительные импорты между слоями. Используй alias (@widgets, @shared и т.д.)",
              },
              {
                group: [
                  "@app/*/*",
                  "@processes/*/*",
                  "@pages/*/*",
                  "@widgets/*/*",
                  "@features/*/*",
                  "@entities/*/*",
                  "@shared/*/*",
                ],
                message:
                  "Импортируй только через public API сегмента (index.js)",
              },
            ],
          },
        ],
      },
    },
    // тесты / сторибуки можно ослабить
    {
      files: ["**/*.test.js", "**/*.stories.jsx"],
      rules: {
        // "no-restricted-imports": "off"
      },
    },
  ],

  ignorePatterns: ["node_modules/", ".next/", "out/", "coverage/"],
};
