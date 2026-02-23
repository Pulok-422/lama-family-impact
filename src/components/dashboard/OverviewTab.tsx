import { useMemo } from "react";
import { VillageData, formatBDT } from "@/lib/dataLoader";
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
  ZAxis,
  Cell,
} from "recharts";

interface OverviewTabProps {
  villages: VillageData[];
}

export default function OverviewTab({ villages }: OverviewTabProps) {
  const top10 = useMemo(() => {
    return [...villages]
      .sort((a, b) => b.Annual_Transfer_BDT - a.Annual_Transfer_BDT)
      .slice(0, 10)
      .map((v) => ({
        name: v.VIL_N_E.length > 18 ? v.VIL_N_E.slice(0, 16) + "…" : v.VIL_N_E,
        value: v.Annual_Transfer_BDT,
      }));
  }, [villages]);

  const scatterData = useMemo(() => {
    return villages.map((v) => ({
      x: v.Climate_Risk_Score,
      y: v.Coverage_Rate * 100,
      z: v.Population_Total,
      name: v.VIL_N_E,
    }));
  }, [villages]);

  const COLORS = [
    "hsl(199, 89%, 32%)",
    "hsl(168, 55%, 42%)",
    "hsl(32, 95%, 50%)",
    "hsl(262, 52%, 50%)",
    "hsl(0, 72%, 51%)",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Top 10 Villages by Annual Transfer
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top10} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tickFormatter={(v) => `৳${(v / 1000000).toFixed(1)}M`}
                fontSize={11}
              />
              <YAxis type="category" dataKey="name" width={120} fontSize={10} />
              <Tooltip
                formatter={(value: number) => [formatBDT(value), "Annual Transfer"]}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {top10.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Climate Risk vs Coverage Rate
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ left: 10, right: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="x"
                name="Climate Risk"
                type="number"
                fontSize={11}
                label={{ value: "Climate Risk Score", position: "bottom", fontSize: 11 }}
              />
              <YAxis
                dataKey="y"
                name="Coverage %"
                type="number"
                fontSize={11}
                label={{ value: "Coverage %", angle: -90, position: "insideLeft", fontSize: 11 }}
              />
              <ZAxis dataKey="z" range={[30, 400]} name="Population" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-md border border-border bg-card p-2 text-xs shadow-lg">
                      <p className="font-semibold">{d.name}</p>
                      <p>Risk: {d.x.toFixed(2)}</p>
                      <p>Coverage: {d.y.toFixed(1)}%</p>
                      <p>Pop: {d.z.toLocaleString()}</p>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData} fill="hsl(199, 89%, 32%)" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
