/* ==========================================================================
   undo.js — snapshot-based undo/redo wrapper for the data slice.
   any action type listed in UNDOABLE_TYPES pushes the previous state onto
   the past stack. undo/redo just shuffle between stacks. time travel, baby.
   ========================================================================== */

export const UNDO = '@history/undo';
export const REDO = '@history/redo';
export const HISTORY_LIMIT = 50;

export const undoable =
  (reducer) =>
  (state = { past: [], present: reducer(undefined, {}), future: [] }, action) => {
    const { past, present, future } = state;

    if (action.type === UNDO) {
      if (!past.length) return state;
      return {
        past: past.slice(0, -1),
        present: past[past.length - 1],
        future: [present, ...future],
      };
    }
    if (action.type === REDO) {
      if (!future.length) return state;
      return {
        past: [...past, present].slice(-HISTORY_LIMIT),
        present: future[0],
        future: future.slice(1),
      };
    }

    const nextPresent = reducer(present, action);
    if (nextPresent === present) return state;

    if (action.meta?.undoable) {
      return {
        past: [...past, present].slice(-HISTORY_LIMIT),
        present: nextPresent,
        future: [],
      };
    }
    return { past, present: nextPresent, future };
  };
