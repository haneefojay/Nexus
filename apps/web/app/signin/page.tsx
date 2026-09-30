"use client";

import { ArrowUpRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/api";

export default function SignInPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function submit(form: FormData) {
    setBusy(true);
    setMessage("");
    try {
      const email = String(form.get("email"));
      const password = String(form.get("password"));
      if (mode === "signup") {
        await api("/v1/auth/sign-up/email", {
          method: "POST",
          body: JSON.stringify({ email, password, name: String(form.get("name")) }),
        });
        setMessage("Check your inbox to verify your email before signing in.");
      } else {
        await api("/v1/auth/sign-in/email", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        router.push("/app");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-grid" aria-hidden="true" />
      <Link className="shell-brand auth-brand" href="/">
        <span className="brand-mark">
          <i />
          <i />
        </span>
        NEXUS
      </Link>
      <section className="auth-panel">
        <p className="eyebrow">OPERATIONS ACCESS / SECURE</p>
        <h1>{mode === "signin" ? "Enter the network." : "Create your operator account."}</h1>
        <p className="auth-copy">
          One authenticated view of every site, asset, and operational signal.
        </p>
        <div className="auth-switch" role="tablist" aria-label="Authentication mode">
          {(["signin", "signup"] as const).map((item) => (
            <button
              aria-selected={mode === item}
              className={mode === item ? "active" : ""}
              key={item}
              onClick={() => setMode(item)}
              role="tab"
              type="button"
            >
              {item === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
        <form action={submit} className="auth-form">
          {mode === "signup" && (
            <label>
              <span>Name</span>
              <input autoComplete="name" name="name" required />
            </label>
          )}
          <label>
            <span>Email</span>
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={12}
              name="password"
              required
              type="password"
            />
          </label>
          <button className="signal-button" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={16} /> : null}
            {mode === "signin" ? "Open NEXUS" : "Create account"}
            <ArrowUpRight size={16} />
          </button>
          {message && (
            <p aria-live="polite" className="form-message">
              {message}
            </p>
          )}
        </form>
      </section>
      <p className="auth-coordinate">34.0522° N / AUTH NODE</p>
    </main>
  );
}
