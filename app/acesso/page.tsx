"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { validatePIN, setAuth, type RestaurantId } from "@/lib/auth";
import { Lock } from "lucide-react";

/**
 * Access page - PIN entry for restaurant authentication
 */
export default function AccessPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validate PIN
    const restaurantId = validatePIN(pin);

    if (!restaurantId) {
      setError("PIN inválido. Tente novamente.");
      setIsSubmitting(false);
      return;
    }

    // Set authentication in localStorage
    setAuth(restaurantId);

    // Set cookie for server components
    const expires = new Date();
    expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    document.cookie = `clearskok_restaurantId=${restaurantId}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;

    // Small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Redirect to dashboard
    router.push("/hoje");
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only numbers
    if (value.length <= 4) {
      setPin(value);
      setError(null); // Clear error when user types
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 rounded-full bg-primary/10 p-3">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Acesso Clearstok</CardTitle>
          <CardDescription>
            Introduza o PIN do seu restaurante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={handlePinChange}
                placeholder="0000"
                maxLength={4}
                className="text-center text-2xl tracking-widest"
                autoFocus
                disabled={isSubmitting}
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || pin.length !== 4}
            >
              {isSubmitting ? "A verificar..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

