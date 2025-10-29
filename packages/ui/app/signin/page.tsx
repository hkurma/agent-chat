"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bot } from "lucide-react";

type Step = "email" | "create-password" | "enter-password";

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { hasPassword } = await api.checkUser(email);

      if (hasPassword) {
        setStep("enter-password");
      } else {
        setStep("create-password");
      }
    } catch {
      toast.error(
        "There is an issue signing you in. Contact system administrator."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { token } = await api.createPassword(email, password);

      // Store JWT token
      setToken(token);

      // Password created successfully, redirect to agents page
      router.push("/agents");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleValidatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { token } = await api.validatePassword(email, password);

      // Store JWT token
      setToken(token);

      // Password validated successfully, redirect to agents page
      router.push("/agents");
    } catch {
      toast.error("Invalid password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("email");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Form Card */}
      <Card className="p-6 space-y-6 border shadow-sm w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground mb-4">
            <Bot className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Chat</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "email" && "Sign in to continue"}
            {step === "create-password" && "Create your account"}
            {step === "enter-password" && "Welcome back"}
          </p>
        </div>

        {/* Email */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2 w-4 h-4" />
                  Checking...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        )}

        {/* Create Password */}
        {step === "create-password" && (
          <form onSubmit={handleCreatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Create Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoFocus
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
            </div>
            <div className="space-y-2 pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner className="mr-2 w-4 h-4" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </Button>
            </div>
          </form>
        )}

        {/* Enter Password */}
        {step === "enter-password" && (
          <form onSubmit={handleValidatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="space-y-2 pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner className="mr-2 w-4 h-4" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
