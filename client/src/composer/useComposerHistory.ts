import { useCallback, useReducer } from "react";
import type { ComposerState } from "../types";

type H = {
  past: ComposerState[];
  present: ComposerState;
  future: ComposerState[];
};

type Action =
  | { type: "set"; next: ComposerState }
  | { type: "replace"; next: ComposerState }
  | { type: "undo" }
  | { type: "redo" };

const MAX_PAST = 60;

function reducer(state: H, action: Action): H {
  switch (action.type) {
    case "replace":
      return { past: [], present: action.next, future: [] };
    case "set": {
      if (action.next === state.present) return state;
      return {
        past: [...state.past, state.present].slice(-MAX_PAST),
        present: action.next,
        future: [],
      };
    }
    case "undo": {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: prev,
        future: [state.present, ...state.future],
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return {
        past: [...state.past, state.present],
        present: next,
        future: rest,
      };
    }
    default:
      return state;
  }
}

export function useComposerHistory(initial: ComposerState) {
  const [state, dispatch] = useReducer(reducer, {
    past: [],
    present: initial,
    future: [],
  } satisfies H);

  const setComposer = useCallback((next: ComposerState) => {
    dispatch({ type: "set", next });
  }, []);

  const replaceComposer = useCallback((next: ComposerState) => {
    dispatch({ type: "replace", next });
  }, []);

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  return {
    composer: state.present,
    setComposer,
    replaceComposer,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
