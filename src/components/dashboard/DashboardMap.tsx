import { useEffect, useRef, useMemo, useCallback } from "react";
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
  allVillagesGeoJSON: any;
  unionsGeoJSON: any;
  colorMetric: ColorMetric;
  selectedVillage: string | null;
  onSelectVillage: (code: string | null) => void;
}

const LAMA_CENTER: L.LatLngTuple = [21.79, 92.26];
const LAMA_ZOOM = 12;

function getCentroid(feature: any): [number, number] | null {
  try {
    const coords = feature.geometry?.coordinates;
    if (!coords || !coords[0]) return null;
    const ring = coords[0];
    let sumLat = 0, sumLng = 0, count = 0;
    for (const pt of ring) {
      sumLng += pt[0];
      sumLat += pt[1];
      count++;
    }
    if (count === 0) return null;
    return [sumLat / count, sumLng / count];
  } catch {
    return null;
  }
}

export default function DashboardMap({
  villagesGeoJSON,
  allVillagesGeoJSON,
  unionsGeoJSON,
  colorMetric,
  selectedVillage,
  onSelectVillage,
}: DashboardMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const villageLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.GeoJSON | null>(null);
  const unionLayerRef = useRef<L.GeoJSON | null>(null);
  const hasFittedRef = useRef(false);

  const onSelectRef = useRef(onSelectVillage);
  onSelectRef.current = onSelectVillage;
  const selectedRef = useRef(selectedVillage);
  selectedRef.current = selectedVillage;

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: LAMA_CENTER,
      zoom: LAMA_ZOOM,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    // Fix container sizing
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fit bounds once using full GeoJSON
  useEffect(() => {
    if (!mapRef.current || !allVillagesGeoJSON || hasFittedRef.current) return;
    hasFittedRef.current = true;

    const doFit = () => {
      if (!mapRef.current) return;
      mapRef.current.invalidateSize();
      
      // Calculate centroid of all features
      let sumLat = 0, sumLng = 0, count = 0;
      allVillagesGeoJSON.features.forEach((f: any) => {
        const c = getCentroid(f);
        if (c) { sumLat += c[0]; sumLng += c[1]; count++; }
      });
      
      if (count > 0) {
        const centerLat = sumLat / count;
        const centerLng = sumLng / count;
        console.log("Setting map center to:", centerLat, centerLng, "from", count, "features");
        mapRef.current.setView([centerLat, centerLng], 11);
      } else {
        mapRef.current.setView(LAMA_CENTER, LAMA_ZOOM);
      }
    };

    // Try immediately and also after a delay
    doFit();
    setTimeout(doFit, 500);
  }, [allVillagesGeoJSON]);

  // Add unions layer
  useEffect(() => {
    if (!mapRef.current || !unionsGeoJSON) return;

    if (unionLayerRef.current) {
      mapRef.current.removeLayer(unionLayerRef.current);
    }

    unionLayerRef.current = L.geoJSON(unionsGeoJSON, {
      style: {
        fillOpacity: 0,
        color: "#888",
        weight: 2,
        dashArray: "6 4",
      },
    }).addTo(mapRef.current);

    unionLayerRef.current.bringToBack();
  }, [unionsGeoJSON]);

  // Compute min/max for color scale
  const { min, max } = useMemo(() => {
    if (!villagesGeoJSON?.features?.length) return { min: 0, max: 1 };
    const values = villagesGeoJSON.features
      .filter((f: any) => f.properties._hasData)
      .map((f: any) => f.properties[colorMetric] || 0);
    if (!values.length) return { min: 0, max: 1 };
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [villagesGeoJSON, colorMetric]);

  const buildTooltip = useCallback((p: any) => {
    return `
      <div style="min-width:220px;font-family:system-ui,sans-serif">
        <strong style="font-size:13px;color:#1a1a2e">${p.VIL_N_E || ""}</strong><br/>
        <span style="color:#666;font-size:11px">Union: ${p.U_M_N_E || ""}</span>
        <hr style="margin:4px 0;border-color:#eee"/>
        <table style="width:100%;font-size:11px;border-collapse:collapse">
          <tr><td style="padding:1px 0">Population</td><td style="text-align:right;font-weight:600">${formatNumber(p.Population_Total || 0)}</td></tr>
          <tr><td style="padding:1px 0">Households</td><td style="text-align:right;font-weight:600">${formatNumber(p.HH_Total || 0)}</td></tr>
          <tr><td style="padding:1px 0">Eligible HH</td><td style="text-align:right;font-weight:600">${formatNumber(p.Eligible_HH || 0)}</td></tr>
          <tr><td style="padding:1px 0">Coverage Rate</td><td style="text-align:right;font-weight:600;color:#6b21a8">${formatPercent(p.Coverage_Rate || 0)}</td></tr>
          <tr><td style="padding:1px 0">Monthly Transfer</td><td style="text-align:right;font-weight:600">${formatBDT(p.Monthly_Transfer_BDT || 0)}</td></tr>
          <tr><td style="padding:1px 0">Annual Transfer</td><td style="text-align:right;font-weight:600">${formatBDT(p.Annual_Transfer_BDT || 0)}</td></tr>
          <tr><td style="padding:1px 0">Climate Risk</td><td style="text-align:right;font-weight:600">${(p.Climate_Risk_Score || 0).toFixed(2)}</td></tr>
          <tr><td style="padding:1px 0">Adequacy Index</td><td style="text-align:right;font-weight:600">${(p.Adequacy_Index || 0).toFixed(2)}</td></tr>
          <tr><td style="padding:1px 0">Flood</td><td style="text-align:right;font-weight:600">${(p.Flood || 0).toFixed(2)}</td></tr>
          <tr><td style="padding:1px 0">Landslide</td><td style="text-align:right;font-weight:600">${(p.Landslide || 0).toFixed(2)}</td></tr>
          <tr><td style="padding:1px 0">Salinity</td><td style="text-align:right;font-weight:600">${(p.Salinity || 0).toFixed(2)}</td></tr>
          <tr><td style="padding:1px 0">Ethnicity</td><td style="text-align:right;font-weight:600">${p.Ethnicity || ""}</td></tr>
        </table>
      </div>
    `;
  }, []);

  // Render village layers: circle markers (always visible) + polygon outlines
  useEffect(() => {
    if (!mapRef.current || !villagesGeoJSON) return;

    // Remove old layers
    if (villageLayerRef.current) {
      mapRef.current.removeLayer(villageLayerRef.current);
    }
    if (polygonLayerRef.current) {
      mapRef.current.removeLayer(polygonLayerRef.current);
    }

    const circleGroup = L.layerGroup();
    let markerCount = 0;

    // Add circle markers at centroids for each village
    villagesGeoJSON.features.forEach((feature: any) => {
      const p = feature.properties;
      if (!p._hasData) return;

      const center = getCentroid(feature);
      if (!center) return;

      const val = p[colorMetric] || 0;
      const isSelected = p.JOIN_CODE === selectedVillage;
      const color = getColorScale(val, min, max);

      const marker = L.circleMarker(center, {
        radius: isSelected ? 12 : 8,
        fillColor: color,
        fillOpacity: isSelected ? 0.95 : 0.85,
        color: isSelected ? "#000" : "#222",
        weight: isSelected ? 3 : 1.5,
      });
      markerCount++;

      marker.bindTooltip(buildTooltip(p), { sticky: true, direction: "top" });

      marker.on("click", () => {
        const code = p.JOIN_CODE;
        onSelectRef.current(code === selectedRef.current ? null : code);
      });

      marker.on("mouseover", function (this: L.CircleMarker) {
        this.setStyle({ radius: 10, weight: 2.5, fillOpacity: 0.95 });
        this.bringToFront();
      });

      marker.on("mouseout", function (this: L.CircleMarker) {
        this.setStyle({
          radius: p.JOIN_CODE === selectedRef.current ? 10 : 7,
          weight: p.JOIN_CODE === selectedRef.current ? 3 : 1.5,
          fillOpacity: p.JOIN_CODE === selectedRef.current ? 0.95 : 0.8,
        });
      });

      circleGroup.addLayer(marker);
    });

    console.log("Added", markerCount, "circle markers to map");

    // Add polygon layer FIRST (behind circles)
    polygonLayerRef.current = L.geoJSON(villagesGeoJSON, {
      style: (feature: any) => {
        const p = feature?.properties;
        const hasData = p?._hasData;
        const val = hasData ? (p[colorMetric] || 0) : 0;
        const isSelected = p?.JOIN_CODE === selectedVillage;
        return {
          fillColor: hasData ? getColorScale(val, min, max) : "#ddd",
          fillOpacity: isSelected ? 0.85 : 0.6,
          color: isSelected ? "#1a1a2e" : "#555",
          weight: isSelected ? 3 : 1.5,
        };
      },
    }).addTo(mapRef.current);

    // Add circles ON TOP of polygons
    circleGroup.addTo(mapRef.current);
    villageLayerRef.current = circleGroup;

    // Ensure unions stay behind everything
    if (unionLayerRef.current) {
      unionLayerRef.current.bringToBack();
    }
  }, [villagesGeoJSON, colorMetric, selectedVillage, min, max, buildTooltip]);

  return (
    <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
  );
}
