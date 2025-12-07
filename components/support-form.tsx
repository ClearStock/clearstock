"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface SupportFormProps {
  restaurantId: string;
  restaurantName: string | null;
}

type SupportType = "bug" | "suggestion" | "question" | "other";

const TYPE_LABELS: Record<SupportType, string> = {
  bug: "Problema / bug",
  suggestion: "Sugestão",
  question: "Dúvida",
  other: "Outro",
};

export default function SupportForm({ restaurantId, restaurantName }: SupportFormProps) {
  const [type, setType] = useState<SupportType | "">("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    type?: string;
    message?: string;
    contact?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!type) {
      newErrors.type = "Por favor, selecione um tipo de mensagem.";
    }

    if (!message.trim()) {
      newErrors.message = "Por favor, escreva a sua mensagem.";
    }

    if (!contact.trim()) {
      newErrors.contact = "Por favor, forneça um email ou número de telemóvel.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          message: message.trim(),
          contact: contact.trim(),
          restaurantId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Erro ao enviar mensagem");
      }

      // Success - clear form and show message
      setType("");
      setMessage("");
      setContact("");
      setErrors({});
      
      toast.success("Obrigado pelo feedback! Vamos analisar e entrar em contacto consigo.");
    } catch (error) {
      console.error("Error submitting support message:", error);
      toast.error(
        "Ocorreu um erro ao enviar o seu pedido. Tente novamente mais tarde.",
        {
          description: error instanceof Error ? error.message : undefined,
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="px-4 py-6 md:px-6 md:py-8">
        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          {/* Tipo de mensagem */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm md:text-base font-medium">
              Tipo de mensagem
            </Label>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as SupportType);
                setErrors((prev) => ({ ...prev, type: undefined }));
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id="type"
                className="h-11 md:h-10 text-base"
                aria-invalid={!!errors.type}
              >
                <SelectValue placeholder="Selecione o tipo de mensagem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Problema / bug</SelectItem>
                <SelectItem value="suggestion">Sugestão</SelectItem>
                <SelectItem value="question">Dúvida</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type}</p>
            )}
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm md:text-base font-medium">
              Mensagem
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setErrors((prev) => ({ ...prev, message: undefined }));
              }}
              placeholder="Ex: Quando tento adicionar um produto transformado, ele não aparece no stock..."
              className="min-h-[120px] text-base resize-none"
              disabled={isSubmitting}
              required
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message}</p>
            )}
          </div>

          {/* Contacto */}
          <div className="space-y-2">
            <Label htmlFor="contact" className="text-sm md:text-base font-medium">
              Contacto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contact"
              type="text"
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                setErrors((prev) => ({ ...prev, contact: undefined }));
              }}
              placeholder="Email ou número de telemóvel"
              className="h-11 md:h-10 text-base"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs md:text-sm text-muted-foreground">
              Email ou número de telemóvel (obrigatório para podermos responder).
            </p>
            {errors.contact && (
              <p className="text-sm text-destructive">{errors.contact}</p>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full bg-indigo-600 text-white rounded-lg py-3 px-4 shadow-md hover:bg-indigo-700 h-11 md:h-12 text-base md:text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? "A enviar..." : "Enviar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

