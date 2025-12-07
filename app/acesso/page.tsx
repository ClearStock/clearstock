"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { validatePinAndLogin, getRestaurantNameByPin } from "@/app/actions";
import { setAuth, PIN_TO_RESTAURANT, type RestaurantId } from "@/lib/auth";
import { Lock } from "lucide-react";

/**
 * Access page - PIN entry for restaurant authentication
 */
export default function AccessPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  // Check if PIN has a restaurant name when PIN is 4 digits
  useEffect(() => {
    const checkRestaurantName = async () => {
      if (pin.length === 4) {
        try {
          const name = await getRestaurantNameByPin(pin);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validate PIN via server action
    const result = await validatePinAndLogin(pin);

    if (!result.success) {
      setError(result.error || "PIN inválido. Tente novamente.");
      setIsSubmitting(false);
      return;
    }

    // Get restaurant ID from PIN mapping for localStorage
    const restaurantId = PIN_TO_RESTAURANT[pin.trim()] as RestaurantId | undefined;
    
    if (!restaurantId) {
      setError("PIN não está associado a um restaurante válido.");
      setIsSubmitting(false);
      return;
    }

    // Set authentication in localStorage
    setAuth(restaurantId);

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
    if (value.length <= 4) {
      setPin(value);
      setError(null); // Clear error when user types
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      {/* Mobile-first card: full width on mobile, max-w-sm on desktop with better spacing */}
      <Card className="w-full max-w-sm bg-white rounded-xl shadow-md mt-8">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto mb-3 rounded-full bg-primary/10 p-3 md:p-4">
            <Lock className="h-6 w-6 md:h-7 md:w-7 text-primary" />
          </div>
          <CardTitle className="text-xl md:text-2xl font-bold">Acesso Clearstok</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Introduza o PIN do seu restaurante.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {restaurantName && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-700 text-center">
              PIN associado a: <span className="font-semibold">{restaurantName}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm font-medium">PIN</Label>
              {/* Large PIN input for easy mobile entry */}
              <Input
                id="pin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={handlePinChange}
                placeholder="0000"
                maxLength={4}
                className="text-center text-2xl md:text-3xl tracking-widest h-14 md:h-16"
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

            {/* Full-width button with indigo styling */}
            <Button
              type="submit"
              className="w-full bg-indigo-600 text-white rounded-lg py-3 px-4 shadow-md hover:bg-indigo-700 h-11 md:h-12 text-base md:text-lg font-semibold"
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

