"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoMark } from "@/components/icons/logo-mark";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-card p-8 shadow-sm">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary mb-5">
          <LogoMark className="size-5" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Join Squash to manage tasks, projects, and more.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <Input type="text" name="name" placeholder="Full name" autoFocus required />
          <Input type="email" name="email" placeholder="Email" required />
          <Input
            type="password"
            name="password"
            placeholder="Password (min. 8 characters)"
            minLength={8}
            required
          />
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
