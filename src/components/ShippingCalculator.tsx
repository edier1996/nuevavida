import React, { useState, useEffect } from "react";
import { calculateShippingCost, getAvailableCities } from "@/lib/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShippingCalculatorProps {
  fromCity: string;
  productPrice: number;
  onShippingCalculated?: (shippingData: {
    baseCost: number;
    platformCommission: number;
    totalShippingCost: number;
    estimatedDays: number;
  }) => void;
}

const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({
  fromCity,
  productPrice,
  onShippingCalculated,
}) => {
  const [toCity, setToCity] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [shouldCalculate, setShouldCalculate] = useState(false);

  const [shippingInfo, setShippingInfo] = useState<{
    baseCost: number;
    platformCommission: number;
    totalShippingCost: number;
    estimatedDays: number;
  } | null>(null);

  const [isCalculating, setIsCalculating] = useState(false);

  // Cargar ciudades disponibles
  useEffect(() => {
    const cities = getAvailableCities();
    setAvailableCities(cities);
  }, []);

  // Calcular envío cuando cambia la ciudad destino
  useEffect(() => {
    if (!toCity || !fromCity || !shouldCalculate) {
      setShippingInfo(null);
      return;
    }

    setIsCalculating(true);
    // Simular delay de cálculo
    setTimeout(() => {
      const info = calculateShippingCost(fromCity, toCity);
      setShippingInfo(info);
      onShippingCalculated?.(info);
      setIsCalculating(false);
    }, 500);
  }, [toCity, shouldCalculate, fromCity, onShippingCalculated]);

  const handleCalculate = () => {
    if (toCity) {
      setShouldCalculate(true);
    }
  };

  const platformCommission = shippingInfo?.platformCommission || 0;
  const totalPrice = productPrice + (shippingInfo?.totalShippingCost || 0);
  const platformEarnings = platformCommission + Math.round(productPrice * 0.05); // 5% de venta + 50% de envío

  return (
    <div className="space-y-4">
      {/* Input de ciudad destino */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-lg">Calcular costo de envío</CardTitle>
          <CardDescription>
            Desde: <span className="font-semibold text-foreground">{fromCity}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="toCity" className="text-sm font-medium">
                Enviar a (Ciudad destino) *
              </Label>
              <Select value={toCity} onValueChange={setToCity}>
                <SelectTrigger id="toCity" className="bg-background">
                  <SelectValue placeholder="Selecciona una ciudad" />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleCalculate}
                disabled={!toCity || isCalculating}
                className="w-full"
                size="sm"
              >
                {isCalculating ? "Calculando..." : "Calcular envío"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultado del cálculo */}
      {shippingInfo && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
          {/* Desglose de costos */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle className="text-base text-green-900">Costo de envío calculado</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Costo base */}
              <div className="space-y-2 rounded-lg bg-white p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Costo base de envío:</span>
                  <span className="font-mono font-semibold text-foreground">
                    ${shippingInfo.baseCost.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Distancia: ~{shippingInfo.estimatedDays} día(s) de entrega
                </div>
              </div>

              {/* Comisión plataforma con icono */}
              <div className="space-y-2 rounded-lg bg-primary/10 p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Comisión de plataforma (50%):</span>
                </div>
                <div className="text-right font-mono text-lg font-bold text-primary">
                  ${platformCommission.toLocaleString()}
                </div>
              </div>

              {/* Total de envío */}
              <div className="border-t-2 border-dashed border-primary/20 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Total a pagar por envío:</span>
                  <span className="font-mono text-xl font-bold text-primary">
                    ${shippingInfo.totalShippingCost.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen total de compra */}
          <Card className="border-slate-200 bg-slate-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumen de compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Precio del producto:</span>
                <span className="font-mono font-semibold">
                  ${productPrice.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground">Costo base de envío:</span>
                <span className="font-mono font-semibold">
                  ${shippingInfo.baseCost.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-primary">
                <span className="text-sm font-medium">Comisión de envío (50%):</span>
                <span className="font-mono font-semibold">
                  ${platformCommission.toLocaleString()}
                </span>
              </div>

              <div className="border-t-2 border-dashed border-primary/30 pt-3">
                <div className="flex items-center justify-between text-lg font-bold text-primary">
                  <span>TOTAL A PAGAR:</span>
                  <span className="font-mono">
                    ${totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información transparencia */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-xs">
              <p className="mb-1 font-semibold">¿Cómo funciona?</p>
              <p>
                La plataforma cobra un 50% adicional sobre el costo base del envío para cubrir gastos de gestión,
                soporte y logística. El vendedor recibe el precio del producto menos la comisión de venta (5%).
              </p>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default ShippingCalculator;
