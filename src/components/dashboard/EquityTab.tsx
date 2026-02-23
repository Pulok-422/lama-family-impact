import { useMemo } from "react";
import { VillageData } from "@/lib/dataLoader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
} from "recharts";

interface EquityTabProps {
  villages: VillageData[];
}

export default function EquityTab({ villages }: EquityTabProps) {
  const coverageByEthnicity = useMemo(() => {
    const map = new Map<string, { totalHH: number; weightedCov: number }>();
    villages.forEach((v) => {
      if (!map.has(v.Ethnicity)) map.set(v.Ethnicity, { totalHH: 0, weightedCov: 0 });
      const e = map.get(v.Ethnicity)!;
      e.totalHH += v.HH_Total;
      e.weightedCov += v.Coverage_Rate * v.HH_Total;
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({
        name,
        coverage: d.totalHH > 0 ? +((d.weightedCov / d.totalHH) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.coverage - a.coverage);
  }, [villages]);

  const poorVsCoverage = useMemo(() => {
    return villages.map((v) => ({
      name: v.VIL_N_E,
      poorShare: v.HH_Total > 0 ? +((v.Poor_HH_Count / v.HH_Total) * 100).toFixed(1) : 0,
      coverage: +(v.Coverage_Rate * 100).toFixed(1),
    }));
  }, [villages]);

  const femaleByUnion = useMemo(() => {
    const map = new Map<string, { total: number; female: number }>();
    villages.forEach((v) => {
      if (!map.has(v.U_M_N_E)) map.set(v.U_M_N_E, { total: 0, female: 0 });
      const u = map.get(v.U_M_N_E)!;
      u.total += v.HH_Total;
      u.female += v.Female_Headed_HH;
    });
    return Array.from(map.entries()).map(([name, d]) => ({
      name,
      rate: d.total > 0 ? +((d.female / d.total) * 100).toFixed(1) : 0,
    }));
  }, [villages]);

  const COLORS = [
    "hsl(199, 89%, 32%)", "hsl(168, 55%, 42%)", "hsl(32, 95%, 50%)",
    "hsl(262, 52%, 50%)", "hsl(0, 72%, 51%)", "hsl(215, 25%, 40%)",
    "hsl(340, 60%, 50%)", "hsl(150, 60%, 35%)", "hsl(45, 80%, 45%)",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Coverage Rate by Ethnicity
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={coverageByEthnicity} margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={10} angle={-25} textAnchor="end" height={60} />
              <YAxis fontSize={11} unit="%" />
              <Tooltip
                formatter={(v: number) => [`${v}%`, "Coverage"]}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="coverage" radius={[4, 4, 0, 0]}>
                {coverageByEthnicity.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Poor HH Share vs Coverage Rate
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ left: 10, right: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="poorShare"
                type="number"
                fontSize={11}
                unit="%"
                label={{ value: "Poor HH %", position: "bottom", fontSize: 11 }}
              />
              <YAxis
                dataKey="coverage"
                type="number"
                fontSize={11}
                unit="%"
                label={{ value: "Coverage %", angle: -90, position: "insideLeft", fontSize: 11 }}
              />
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-md border border-border bg-card p-2 text-xs shadow-lg">
                      <p className="font-semibold">{d.name}</p>
                      <p>Poor HH: {d.poorShare}%</p>
                      <p>Coverage: {d.coverage}%</p>
                    </div>
                  );
                }}
              />
              <Scatter data={poorVsCoverage} fill="hsl(168, 55%, 42%)" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Female-Headed HH Rate by Union
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={femaleByUnion} margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={10} angle={-25} textAnchor="end" height={60} />
              <YAxis fontSize={11} unit="%" />
              <Tooltip
                formatter={(v: number) => [`${v}%`, "Female HH Rate"]}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="rate" fill="hsl(262, 52%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
