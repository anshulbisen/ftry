export default {
  // TypeScript/JavaScript files
  '**/*.{ts,tsx,js,jsx,mjs,cjs}': (filenames) => [
    `nx affected --target=lint --files=${filenames.join(',')} --fix`,
    `prettier --write ${filenames.join(' ')}`,
  ],

  // JSON, YAML, Markdown files
  '**/*.{json,yaml,yml,md}': (filenames) => [`prettier --write ${filenames.join(' ')}`],

  // TypeScript files - type check
  '**/*.{ts,tsx}': () => ['nx affected --target=typecheck --parallel=3'],
};
