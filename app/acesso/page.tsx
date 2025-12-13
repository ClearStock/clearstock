"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { validatePinAndLogin, getRestaurantNameByPin } from "@/app/actions";
import { normalizePIN } from "@/lib/auth";
import { Lock } from "lucide-react";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60 * 1000; // 60 seconds in milliseconds

/**
 * Access page - PIN entry for restaurant authentication
 * Authentication is now fully server-side - no localStorage manipulation
 */
export default function AccessPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

  // Check if PIN has a restaurant name when PIN is 6 digits
  useEffect(() => {
    const checkRestaurantName = async () => {
      if (pin.length === 6) {
        try {
          // Try both 6-digit and normalized (4-digit padded) versions
          const normalizedPin = normalizePIN(pin);
          const name = await getRestaurantNameByPin(normalizedPin);
          setRestaurantName(name);
        } catch (error) {
          // Silently fail - this is just for display
          setRestaurantName(null);
        }
      } else {
        setRestaurantName(null);
      }
    };

    const timeoutId = setTimeout(checkRestaurantName, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [pin]);

  // Handle lockout timer
  useEffect(() => {
    if (!isLocked) return;

    const interval = setInterval(() => {
      const timeLeft = Math.ceil(lockoutTimeLeft / 1000);
      setLockoutTimeLeft((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          setIsLocked(false);
          setFailedAttempts(0);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, lockoutTimeLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check if locked out
    if (isLocked) {
      return;
    }

    // Validate PIN length
    if (pin.length !== 6) {
      setError("O PIN deve ter 6 dígitos.");
      return;
    }

    setIsSubmitting(true);

    // Normalize PIN (handle 4-digit backward compatibility)
    const normalizedPin = normalizePIN(pin);
    
    // Validate PIN via server action (creates server-side session)
    const result = await validatePinAndLogin(normalizedPin);

    if (!result.success) {
      // Increment failed attempts
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setLockoutTimeLeft(LOCKOUT_DURATION);
        setError("Demasiadas tentativas. Tente novamente dentro de 1 minuto.");
      } else {
        setError("PIN inválido. Verifique e tente novamente.");
      }
      setIsSubmitting(false);
      return;
    }

    // Success - reset failed attempts
    setFailedAttempts(0);

    // Server has already set the secure session cookie
    // No client-side authentication state needed

    // Small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Redirect based on whether restaurant has a name
    if (result.needsOnboarding) {
      router.push("/onboarding");
    } else {
      router.push("/hoje");
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only numbers
    if (value.length <= 6) {
      setPin(value);
      setError(null); // Clear error when user types
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Acesso</CardTitle>
          <CardDescription>
            Introduza o PIN de 6 dígitos do seu restaurante.
          </CardDescription>
          {restaurantName && (
            <div className="mt-2 rounded-md bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">PIN associado a: </span>
              <span className="font-medium">{restaurantName}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm font-medium">PIN (6 dígitos)</Label>
              <Input
                id="pin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={handlePinChange}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest h-14"
                autoFocus
                disabled={isSubmitting || isLocked}
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-indigo-600 text-white rounded-lg py-3 px-4 shadow-md hover:bg-indigo-700 font-semibold text-base"
              size="lg"
              disabled={isSubmitting || isLocked || pin.length !== 6}
            >
              {isSubmitting ? "A verificar..." : isLocked ? `Aguarde ${Math.ceil(lockoutTimeLeft / 1000)}s` : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
