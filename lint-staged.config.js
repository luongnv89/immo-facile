const path = require('path');

/**
 * Map staged file paths to paths relative to the given subdirectory,
 * so per-package tools can run with their own working directory.
 * @param {string} dir - Directory path relative to the repository root.
 * @param {string[]} files - Staged file paths.
 * @returns {string} Space-separated relative paths.
 */
function relativeTo(dir, files) {
  const base = path.resolve(process.cwd(), dir);
  return files.map((file) => path.relative(base, file)).join(' ');
}

module.exports = {
  'client/**/*.{js,jsx}': (files) => [
    `prettier --write ${files.join(' ')}`,
    `cd client && npx eslint --fix ${relativeTo('client', files)}`,
  ],
  'server/**/*.js': (files) => `prettier --write ${files.join(' ')}`,
};
