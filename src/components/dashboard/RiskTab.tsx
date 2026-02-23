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
  Legend,
} from "recharts";

interface RiskTabProps {
  villages: VillageData[];
}

export default function RiskTab({ villages }: RiskTabProps) {
  const unionRisks = useMemo(() => {
    const map = new Map<string, { flood: number[]; landslide: number[]; salinity: number[] }>();
    villages.forEach((v) => {
      if (!map.has(v.U_M_N_E)) map.set(v.U_M_N_E, { flood: [], landslide: [], salinity: [] });
      const u = map.get(v.U_M_N_E)!;
      u.flood.push(v.Flood);
      u.landslide.push(v.Landslide);
      u.salinity.push(v.Salinity);
    });
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      Flood: +(data.flood.reduce((a, b) => a + b, 0) / data.flood.length).toFixed(2),
      Landslide: +(data.landslide.reduce((a, b) => a + b, 0) / data.landslide.length).toFixed(2),
      Salinity: +(data.salinity.reduce((a, b) => a + b, 0) / data.salinity.length).toFixed(2),
    }));
  }, [villages]);

  const sortedByAdequacy = useMemo(() => {
    return [...villages].sort((a, b) => b.Adequacy_Index - a.Adequacy_Index).slice(0, 20);
  }, [villages]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Average Risk by Union
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={unionRisks} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={10} angle={-25} textAnchor="end" height={60} />
              <YAxis fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Flood" fill="hsl(199, 89%, 32%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Landslide" fill="hsl(32, 95%, 50%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Salinity" fill="hsl(0, 72%, 51%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Villages by Adequacy Index (Top 20)
        </h3>
        <div className="overflow-auto max-h-64 rounded-md border border-border">
          <table className="w-full text-xs">
            <thead className="bg-secondary sticky top-0">
              <tr>
                <th className="text-left p-2 font-semibold text-secondary-foreground">Village</th>
                <th className="text-left p-2 font-semibold text-secondary-foreground">Union</th>
                <th className="text-right p-2 font-semibold text-secondary-foreground">Adequacy</th>
                <th className="text-right p-2 font-semibold text-secondary-foreground">Risk</th>
                <th className="text-right p-2 font-semibold text-secondary-foreground">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {sortedByAdequacy.map((v) => (
                <tr key={v.JOIN_CODE} className="border-t border-border hover:bg-muted/50">
                  <td className="p-2">{v.VIL_N_E}</td>
                  <td className="p-2 text-muted-foreground">{v.U_M_N_E}</td>
                  <td className="p-2 text-right font-medium">{v.Adequacy_Index.toFixed(2)}</td>
                  <td className="p-2 text-right">{v.Climate_Risk_Score.toFixed(2)}</td>
                  <td className="p-2 text-right">{(v.Coverage_Rate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
