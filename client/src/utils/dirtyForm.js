/**
 * dirtyForm — shared dirty-form signal (#113).
 *
 * Hash navigation is orchestrated by Dashboard while the create/edit forms
 * live in sub-routes (e.g. #/tenants/5/edit), so a tiny module-level flag
 * lets the nav layer ask "is a dirty form currently mounted?" before
 * honoring a route change. The form scaffold (FormPage) records its own
 * hash while dirty and clears it on unmount / intentional navigation;
 * Dashboard consults it from selectTab / hashchange and can revert the
 * location back to the form's route while asking for confirmation.
 */
let dirtyRoute = null;

/** Record the current dirty form's route hash, or clear with null. */
export const setFormDirty = route => {
  dirtyRoute = route || null;
};

/** The dirty form's route hash (e.g. '#/tenants/5/edit'), or null. */
export const getDirtyRoute = () => dirtyRoute;

/** Test hook — reset between tests. */
export const resetFormDirty = () => {
  dirtyRoute = null;
};
