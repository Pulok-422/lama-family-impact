import { formatBDT, formatNumber, formatPercent } from "@/lib/dataLoader";
import { Users, Home, Banknote, ShieldCheck, AlertTriangle, Gauge } from "lucide-react";

interface KPICardsProps {
  kpis: {
    totalPop: number;
    totalEligible: number;
    totalTransfer: number;
    weightedCoverage: number;
    avgRisk: number;
    avgAdequacy: number;
  } | null;
}

const cards = [
  { key: "totalPop", label: "Total Population", icon: Users, color: "kpi-population", format: formatNumber },
  { key: "totalEligible", label: "Eligible Households", icon: Home, color: "kpi-household", format: formatNumber },
  { key: "totalTransfer", label: "Annual Transfer", icon: Banknote, color: "kpi-transfer", format: formatBDT },
  { key: "weightedCoverage", label: "Avg Coverage Rate", icon: ShieldCheck, color: "kpi-coverage", format: formatPercent },
  { key: "avgRisk", label: "Avg Climate Risk", icon: AlertTriangle, color: "kpi-risk", format: (v: number) => v.toFixed(2) },
  { key: "avgAdequacy", label: "Avg Adequacy Index", icon: Gauge, color: "kpi-adequacy", format: (v: number) => v.toFixed(2) },
] as const;

export default function KPICards({ kpis }: KPICardsProps) {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = kpis[card.key as keyof typeof kpis];
        return (
          <div
            key={card.key}
            className="rounded-lg border border-border bg-card p-3 animate-fade-in"
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ backgroundColor: `hsl(var(--${card.color}) / 0.15)` }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: `hsl(var(--${card.color}))` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p
              className="text-lg font-bold"
              style={{ color: `hsl(var(--${card.color}))` }}
            >
              {card.format(value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
