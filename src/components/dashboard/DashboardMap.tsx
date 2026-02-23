import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import {
  ColorMetric,
  getColorScale,
  formatPercent,
  formatBDT,
  formatNumber,
} from "@/lib/dataLoader";

interface DashboardMapProps {
  villagesGeoJSON: any;
  unionsGeoJSON: any;
  colorMetric: ColorMetric;
  selectedVillage: string | null;
  onSelectVillage: (code: string | null) => void;
}

export default function DashboardMap({
  villagesGeoJSON,
  unionsGeoJSON,
  colorMetric,
  selectedVillage,
  onSelectVillage,
}: DashboardMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const villageLayerRef = useRef<L.GeoJSON | null>(null);
  const unionLayerRef = useRef<L.GeoJSON | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [21.78, 92.28],
      zoom: 11,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add unions layer
  useEffect(() => {
    if (!mapRef.current || !unionsGeoJSON) return;

    if (unionLayerRef.current) {
      mapRef.current.removeLayer(unionLayerRef.current);
    }

    unionLayerRef.current = L.geoJSON(unionsGeoJSON, {
      style: {
        fillOpacity: 0,
        color: "#999",
        weight: 1.5,
        dashArray: "4 4",
      },
    }).addTo(mapRef.current);

    // Ensure unions stay behind
    unionLayerRef.current.bringToBack();
  }, [unionsGeoJSON]);

  // Compute min/max for color scale
  const { min, max } = useMemo(() => {
    if (!villagesGeoJSON?.features?.length) return { min: 0, max: 1 };
    const values = villagesGeoJSON.features.map(
      (f: any) => f.properties[colorMetric] || 0
    );
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [villagesGeoJSON, colorMetric]);

  // Add/update villages layer
  useEffect(() => {
    if (!mapRef.current || !villagesGeoJSON) return;

    if (villageLayerRef.current) {
      mapRef.current.removeLayer(villageLayerRef.current);
    }

    villageLayerRef.current = L.geoJSON(villagesGeoJSON, {
      style: (feature: any) => {
        const val = feature?.properties?.[colorMetric] || 0;
        const isSelected = feature?.properties?.JOIN_CODE === selectedVillage;
        return {
          fillColor: getColorScale(val, min, max),
          fillOpacity: isSelected ? 0.9 : 0.65,
          color: isSelected ? "#1a1a2e" : "#555",
          weight: isSelected ? 3 : 1,
        };
      },
      onEachFeature: (feature: any, layer: L.Layer) => {
        const p = feature.properties;
        const tooltip = `
          <div style="min-width:200px">
            <strong style="font-size:13px">${p.VIL_N_E || ""}</strong><br/>
            <span style="color:#666">Union: ${p.U_M_N_E || ""}</span>
            <hr style="margin:4px 0;border-color:#eee"/>
            <table style="width:100%;font-size:11px">
              <tr><td>Population</td><td style="text-align:right;font-weight:600">${formatNumber(p.Population_Total || 0)}</td></tr>
              <tr><td>Households</td><td style="text-align:right;font-weight:600">${formatNumber(p.HH_Total || 0)}</td></tr>
              <tr><td>Eligible HH</td><td style="text-align:right;font-weight:600">${formatNumber(p.Eligible_HH || 0)}</td></tr>
              <tr><td>Coverage Rate</td><td style="text-align:right;font-weight:600">${formatPercent(p.Coverage_Rate || 0)}</td></tr>
              <tr><td>Monthly Transfer</td><td style="text-align:right;font-weight:600">${formatBDT(p.Monthly_Transfer_BDT || 0)}</td></tr>
              <tr><td>Annual Transfer</td><td style="text-align:right;font-weight:600">${formatBDT(p.Annual_Transfer_BDT || 0)}</td></tr>
              <tr><td>Climate Risk</td><td style="text-align:right;font-weight:600">${(p.Climate_Risk_Score || 0).toFixed(2)}</td></tr>
              <tr><td>Adequacy Index</td><td style="text-align:right;font-weight:600">${(p.Adequacy_Index || 0).toFixed(2)}</td></tr>
              <tr><td>Flood</td><td style="text-align:right;font-weight:600">${(p.Flood || 0).toFixed(2)}</td></tr>
              <tr><td>Landslide</td><td style="text-align:right;font-weight:600">${(p.Landslide || 0).toFixed(2)}</td></tr>
              <tr><td>Salinity</td><td style="text-align:right;font-weight:600">${(p.Salinity || 0).toFixed(2)}</td></tr>
              <tr><td>Ethnicity</td><td style="text-align:right;font-weight:600">${p.Ethnicity || ""}</td></tr>
            </table>
          </div>
        `;
        layer.bindTooltip(tooltip, { sticky: true, direction: "top" });

        layer.on({
          mouseover: (e: any) => {
            const l = e.target;
            l.setStyle({ weight: 3, fillOpacity: 0.85 });
            l.bringToFront();
          },
          mouseout: (e: any) => {
            villageLayerRef.current?.resetStyle(e.target);
          },
          click: (e: any) => {
            const code = e.target.feature?.properties?.JOIN_CODE;
            onSelectVillage(code === selectedVillage ? null : code);
          },
        });
      },
    }).addTo(mapRef.current);

    // Fit bounds if we have features
    if (villagesGeoJSON.features.length > 0) {
      const bounds = villageLayerRef.current.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
      }
    }

    // Ensure unions stay behind
    if (unionLayerRef.current) {
      unionLayerRef.current.bringToBack();
    }
  }, [villagesGeoJSON, colorMetric, selectedVillage, min, max, onSelectVillage]);

  return (
    <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
  );
}
