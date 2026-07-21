"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-card p-8 shadow-sm">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary mb-5">
          <Lock className="size-4" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Foundry</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your password to continue.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <Input
            type="password"
            name="password"
            placeholder="Password"
            autoFocus
            required
          />
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Checking..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
