"use client";

import { useEffect, useState } from "react";
import { StockView } from "./stock-view";
import type { BatchWithRelations } from "@/lib/stock-utils";
import type { Category, Location, Restaurant } from "@prisma/client";

interface StockViewWrapperProps {
  batches: any[];
  restaurant: any;
  categories: any[];
  locations: any[];
}

/**
 * Wrapper que garante conversão segura de dados serializados do server
 * e adiciona error boundary client-side.
 */
export function StockViewWrapper({
  batches,
  restaurant,
  categories,
  locations,
}: StockViewWrapperProps) {
  const [convertedData, setConvertedData] = useState<{
    batches: BatchWithRelations[];
    restaurant: Restaurant;
    categories: Category[];
    locations: Location[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Converter strings de data para Date objects
      const convertedBatches: BatchWithRelations[] = batches.map((batch) => ({
        ...batch,
        expiryDate:
          typeof batch.expiryDate === "string"
            ? new Date(batch.expiryDate)
            : batch.expiryDate,
        createdAt:
          typeof batch.createdAt === "string"
            ? new Date(batch.createdAt)
            : batch.createdAt,
        updatedAt:
          typeof batch.updatedAt === "string"
            ? new Date(batch.updatedAt)
            : batch.updatedAt,
        category: batch.category
          ? {
              ...batch.category,
              createdAt:
                typeof batch.category.createdAt === "string"
                  ? new Date(batch.category.createdAt)
                  : batch.category.createdAt,
              updatedAt:
                typeof batch.category.updatedAt === "string"
                  ? new Date(batch.category.updatedAt)
                  : batch.category.updatedAt,
            }
          : null,
        location: batch.location
          ? {
              ...batch.location,
              createdAt:
                typeof batch.location.createdAt === "string"
                  ? new Date(batch.location.createdAt)
                  : batch.location.createdAt,
              updatedAt:
                typeof batch.location.updatedAt === "string"
                  ? new Date(batch.location.updatedAt)
                  : batch.location.updatedAt,
            }
          : null,
      }));

      setConvertedData({
        batches: convertedBatches,
        restaurant,
        categories,
        locations,
      });
    } catch (err) {
      console.error("Error converting stock data:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  }, [batches, restaurant, categories, locations]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
          <p className="text-lg font-medium text-destructive mb-2">
            Erro ao carregar stock
          </p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!convertedData) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border p-6 text-center">
          <p className="text-sm text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  return <StockView {...convertedData} />;
}

