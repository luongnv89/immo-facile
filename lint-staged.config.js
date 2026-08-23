module.exports = {
  'client/**/*.{js,jsx}': files => [
    `prettier --write ${files.join(' ')}`,
    // lint-staged 17 spawns commands directly (no shell), so `cd client && …`
    // cannot be used here; `npm --prefix` runs the script inside client/.
    `npm --prefix client run lint:staged -- ${files.join(' ')}`,
  ],
  'server/**/*.js': files => {
    return `prettier --write ${files.join(' ')}`;
  },
};
