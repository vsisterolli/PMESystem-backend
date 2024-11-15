module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: "tsconfig.json",
        tsconfigRootDir: __dirname,
        sourceType: "module"
    },
    plugins: ["@typescript-eslint/eslint-plugin", "unused-imports"],
    extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
        "prettier"
    ],
    root: true,
    env: {
        node: true,
        jest: true
    },
    ignorePatterns: [
        ".eslintrc.js",
        "./dist",
        "./node_modules",
        "**/*.d.ts",
        "**/*.js"
    ],
    rules: {
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "unused-imports/no-unused-imports": "error",
        "@typescript-eslint/ban-ts-comment": "off",
        indent: ["error", "tab"],
        "linebreak-style": ["error", "unix"],
        quotes: ["error", "double"],
        semi: ["error", "always"]
    }
};
