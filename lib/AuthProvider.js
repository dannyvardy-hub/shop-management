"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function login(email, password) {
    setError("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError(readableAuthError(e.code));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await signOut(auth);
  }

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="font-mono text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={login} error={error} busy={busy} />;
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function readableAuthError(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email or password isn't right.";
    case "auth/invalid-email":
      return "That email address doesn't look valid.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a bit and try again.";
    default:
      return "Couldn't sign in. Check your details and try again.";
  }
}

function LoginScreen({ onLogin, error, busy }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-ledger/60 mb-2">
            FAITH SHOP MANAGEMENT SYSTEM
          </p>
          <h1 className="font-display text-3xl text-ink">Sign in</h1>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin(email, password);
          }}
          className="bg-white border border-line rounded-lg p-6 space-y-4 shadow-sm"
        >
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink/60 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-ledger/40"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink/60 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-ledger/40"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-brick text-sm">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-ledger text-white rounded-md py-2 font-medium hover:bg-ledger/90 transition disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-center text-xs text-ink/40 mt-4">
          Create your account in the Firebase console → Authentication → Users.
        </p>
      </div>
    </div>
  );
}
