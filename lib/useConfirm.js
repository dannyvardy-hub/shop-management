"use client";

import { useState, useCallback } from "react";

export function useConfirm() {
  const [state, setState] = useState(null); // {message, resolve}

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setState({ message, resolve });
    });
  }, []);

  function handle(result) {
    state?.resolve(result);
    setState(null);
  }

  const dialog = state ? (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-5">
        <p className="text-sm text-ink mb-5 whitespace-pre-line">{state.message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handle(false)}
            className="px-4 py-2 text-sm rounded-md text-ink/60 hover:bg-paper transition"
          >
            Cancel
          </button>
          <button
            onClick={() => handle(true)}
            className="px-4 py-2 text-sm rounded-md bg-ledger text-white hover:bg-ledger/90 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
