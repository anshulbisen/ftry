import { relative } from 'path';

export default {
  // TypeScript/JavaScript files
  '**/*.{ts,tsx,js,jsx,mjs,cjs}': (filenames) => {
    const relativePaths = filenames.map((f) => relative(process.cwd(), f));
    return [
      `nx affected --target=lint --files=${relativePaths.join(',')} --fix`,
      `prettier --write ${filenames.join(' ')}`,
    ];
  },

  // JSON, YAML, Markdown files
  '**/*.{json,yaml,yml,md}': (filenames) => [`prettier --write ${filenames.join(' ')}`],

  // TypeScript files - type check
  '**/*.{ts,tsx}': () => ['nx affected --target=typecheck --parallel=3'],
};
