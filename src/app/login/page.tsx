"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoMark } from "@/components/icons/logo-mark";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-card p-8 shadow-sm">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary mb-5">
          <LogoMark className="size-5" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Squash</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your account to continue.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <Input
            type="email"
            name="email"
            placeholder="Email"
            autoFocus
            required
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            required
          />
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
