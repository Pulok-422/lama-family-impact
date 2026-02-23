import { useState, useEffect, useMemo, useCallback } from "react";
import {
  VillageData,
  ColorMetric,
  loadExcelData,
  loadGeoJSON,
  joinDataToGeoJSON,
} from "@/lib/dataLoader";

export function useDashboardData() {
  const [villagesGeoJSON, setVillagesGeoJSON] = useState<any>(null);
  const [unionsGeoJSON, setUnionsGeoJSON] = useState<any>(null);
  const [allVillages, setAllVillages] = useState<VillageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [colorMetric, setColorMetric] = useState<ColorMetric>("Coverage_Rate");
  const [selectedVillage, setSelectedVillage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [excel, villages, unions] = await Promise.all([
          loadExcelData(),
          loadGeoJSON("/data/lama_villages.geojson"),
          loadGeoJSON("/data/lama_unions.geojson"),
        ]);
        const joined = joinDataToGeoJSON(villages, excel);
        setAllVillages(excel);
        setVillagesGeoJSON(joined);
        setUnionsGeoJSON(unions);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredVillages = useMemo(() => {
    let data = allVillages;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((v) => v.VIL_N_E.toLowerCase().includes(q));
    }
    if (selectedVillage) {
      data = data.filter((v) => v.JOIN_CODE === selectedVillage);
    }
    return data;
  }, [allVillages, searchQuery, selectedVillage]);

  const filteredGeoJSON = useMemo(() => {
    if (!villagesGeoJSON) return null;
    if (!searchQuery && !selectedVillage) return villagesGeoJSON;

    const codes = new Set(filteredVillages.map((v) => v.JOIN_CODE));
    return {
      ...villagesGeoJSON,
      features: villagesGeoJSON.features.filter((f: any) =>
        codes.has(f.properties.JOIN_CODE)
      ),
    };
  }, [villagesGeoJSON, filteredVillages, searchQuery, selectedVillage]);

  const resetFilters = useCallback(() => {
    setSelectedVillage(null);
    setSearchQuery("");
  }, []);

  const kpis = useMemo(() => {
    const data = filteredVillages;
    if (!data.length) return null;
    const totalPop = data.reduce((s, v) => s + v.Population_Total, 0);
    const totalEligible = data.reduce((s, v) => s + v.Eligible_HH, 0);
    const totalTransfer = data.reduce((s, v) => s + v.Annual_Transfer_BDT, 0);
    const totalHH = data.reduce((s, v) => s + v.HH_Total, 0);
    const weightedCoverage =
      totalHH > 0
        ? data.reduce((s, v) => s + v.Coverage_Rate * v.HH_Total, 0) / totalHH
        : 0;
    const avgRisk =
      data.reduce((s, v) => s + v.Climate_Risk_Score, 0) / data.length;
    const avgAdequacy =
      data.reduce((s, v) => s + v.Adequacy_Index, 0) / data.length;
    return {
      totalPop,
      totalEligible,
      totalTransfer,
      weightedCoverage,
      avgRisk,
      avgAdequacy,
    };
  }, [filteredVillages]);

  return {
    loading,
    error,
    villagesGeoJSON: filteredGeoJSON,
    allVillagesGeoJSON: villagesGeoJSON,
    unionsGeoJSON,
    allVillages,
    filteredVillages,
    colorMetric,
    setColorMetric,
    selectedVillage,
    setSelectedVillage,
    searchQuery,
    setSearchQuery,
    resetFilters,
    kpis,
  };
}
