import * as XLSX from "xlsx";

export interface VillageData {
  JOIN_CODE: string;
  DIV_N_E: string;
  DIS_N_E: string;
  UPA_N_E: string;
  U_M_N_E: string;
  VIL_N_E: string;
  VIL_N_B: string;
  Ethnicity: string;
  Population_Total: number;
  HH_Total: number;
  Female_Headed_HH: number;
  Poor_HH_Count: number;
  Eligible_HH: number;
  Coverage_Rate: number;
  Monthly_Transfer_BDT: number;
  Annual_Transfer_BDT: number;
  Climate_Risk_Score: number;
  Adequacy_Index: number;
  Flood: number;
  Landslide: number;
  Salinity: number;
}

function parseNumber(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const str = String(val).replace(/,/g, "").replace(/BDT\s*/gi, "").replace(/%/g, "").trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseRate(val: any): number {
  if (typeof val === "number") return val > 1 ? val / 100 : val;
  if (!val) return 0;
  const str = String(val).replace(/%/g, "").trim();
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return num > 1 ? num / 100 : num;
}

export async function loadExcelData(): Promise<VillageData[]> {
  const response = await fetch("/data/Lama_with_familycard_sample.xlsx");
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(sheet);

  return rows.map((row: any) => ({
    JOIN_CODE: String(row.JOIN_CODE || ""),
    DIV_N_E: String(row.DIV_N_E || ""),
    DIS_N_E: String(row.DIS_N_E || ""),
    UPA_N_E: String(row.UPA_N_E || ""),
    U_M_N_E: String(row.U_M_N_E || ""),
    VIL_N_E: String(row.VIL_N_E || ""),
    VIL_N_B: String(row.VIL_N_B || ""),
    Ethnicity: String(row.Ethnicity || ""),
    Population_Total: parseNumber(row.Population_Total),
    HH_Total: parseNumber(row.HH_Total),
    Female_Headed_HH: parseNumber(row.Female_Headed_HH),
    Poor_HH_Count: parseNumber(row.Poor_HH_Count),
    Eligible_HH: parseNumber(row.Eligible_HH),
    Coverage_Rate: parseRate(row.Coverage_Rate),
    Monthly_Transfer_BDT: parseNumber(row.Monthly_Transfer_BDT),
    Annual_Transfer_BDT: parseNumber(row.Annual_Transfer_BDT),
    Climate_Risk_Score: parseNumber(row.Climate_Risk_Score),
    Adequacy_Index: parseNumber(row.Adequacy_Index),
    Flood: parseNumber(row.Flood),
    Landslide: parseNumber(row.Landslide),
    Salinity: parseNumber(row.Salinity),
  }));
}

export async function loadGeoJSON(path: string): Promise<any> {
  const response = await fetch(path);
  return response.json();
}

export function joinDataToGeoJSON(
  geojson: any,
  data: VillageData[]
): any {
  const dataMap = new Map<string, VillageData>();
  data.forEach((d) => dataMap.set(d.JOIN_CODE, d));

  const joinedFeatures = geojson.features
    .map((feature: any) => {
      const code = feature.properties?.JOIN_CODE;
      const villageData = code ? dataMap.get(code) : undefined;
      if (!villageData) return null;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          ...villageData,
        },
      };
    })
    .filter(Boolean);

  return { ...geojson, features: joinedFeatures };
}

export type ColorMetric =
  | "Coverage_Rate"
  | "Annual_Transfer_BDT"
  | "Climate_Risk_Score"
  | "Adequacy_Index"
  | "Flood"
  | "Landslide"
  | "Salinity";

export const METRIC_LABELS: Record<ColorMetric, string> = {
  Coverage_Rate: "Coverage Rate",
  Annual_Transfer_BDT: "Annual Transfer (BDT)",
  Climate_Risk_Score: "Climate Risk Score",
  Adequacy_Index: "Adequacy Index",
  Flood: "Flood Risk",
  Landslide: "Landslide Risk",
  Salinity: "Salinity Risk",
};

export function getColorScale(value: number, min: number, max: number): string {
  const t = max === min ? 0.5 : (value - min) / (max - min);
  // Blue (low) → Yellow → Red (high)
  const r = Math.round(t < 0.5 ? t * 2 * 255 : 255);
  const g = Math.round(t < 0.5 ? 128 + t * 2 * 127 : 255 - (t - 0.5) * 2 * 255);
  const b = Math.round(t < 0.5 ? 200 - t * 2 * 200 : 0);
  return `rgb(${r},${g},${b})`;
}

export function formatBDT(val: number): string {
  return `৳${val.toLocaleString("en-IN")}`;
}

export function formatPercent(val: number): string {
  return `${(val * 100).toFixed(1)}%`;
}

export function formatNumber(val: number): string {
  return val.toLocaleString("en-IN");
}
