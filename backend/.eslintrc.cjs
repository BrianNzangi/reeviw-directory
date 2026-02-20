module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  env: {
    node: true,
    es2022: true,
  },
  extends: ["eslint:recommended", "prettier"],
  ignorePatterns: ["dist", "node_modules"],
};
