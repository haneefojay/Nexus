"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/api";

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const [message, setMessage] = useState(
    "Accept this invitation to join the infrastructure network.",
  );
  const router = useRouter();

  async function accept() {
    try {
      await api("/v1/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      router.push("/app");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invitation could not be accepted");
    }
  }

  return (
    <main className="auth-page">
      <Link className="shell-brand auth-brand" href="/">
        <span className="brand-mark">
          <i />
          <i />
        </span>
        NEXUS
      </Link>
      <section className="auth-panel">
        <p className="eyebrow">ORGANIZATION INVITATION</p>
        <h1>Join the operational picture.</h1>
        <p className="auth-copy">{message}</p>
        <button className="signal-button" onClick={accept}>
          Accept invitation <ArrowUpRight size={16} />
        </button>
        <Link className="text-link" href="/signin">
          Sign in first
        </Link>
      </section>
    </main>
  );
}
