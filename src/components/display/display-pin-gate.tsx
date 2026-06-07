"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const UNLOCK_KEY = "display-pin-unlocked";

interface DisplayPinGateProps {
  pinCode: string | null;
  children: React.ReactNode;
}

export function DisplayPinGate({ pinCode, children }: DisplayPinGateProps) {
  const [unlocked, setUnlocked] = useState(!pinCode);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pinCode) {
      setUnlocked(true);
      return;
    }

    const stored = sessionStorage.getItem(UNLOCK_KEY);
    setUnlocked(stored === pinCode);
  }, [pinCode]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (input.trim() === pinCode) {
      sessionStorage.setItem(UNLOCK_KEY, pinCode!);
      setUnlocked(true);
      setError("");
      return;
    }
    setError("Incorrect PIN");
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="display-pin-gate">
      <form onSubmit={handleSubmit} className="display-pin-gate-form">
        <h1 className="font-heading text-2xl font-semibold">Display Locked</h1>
        <p className="text-sm opacity-80">Enter the TV display PIN to continue.</p>
        <Input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="display-pin-gate-input"
          aria-label="Display PIN"
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="btn-gold">
          Unlock Display
        </Button>
      </form>
    </div>
  );
}
