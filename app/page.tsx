import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";

/**
 * Landing page - Public, no authentication required
 * Simple hero with button to access page
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 text-center px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-primary/10 p-4">
          <ChefHat className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Clearstok
        </h1>
        <p className="max-w-[600px] text-muted-foreground md:text-xl">
          Controla validades, evita desperdício, organiza o stock da tua cozinha.
        </p>
      </div>

      <div className="flex gap-4">
        <Link href="/acesso">
          <Button size="lg" className="font-semibold">
            Entrar na aplicação
          </Button>
        </Link>
      </div>
    </div>
  );
}
