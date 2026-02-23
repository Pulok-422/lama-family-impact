import { useDashboardData } from "@/hooks/useDashboardData";
import DashboardMap from "@/components/dashboard/DashboardMap";
import KPICards from "@/components/dashboard/KPICards";
import OverviewTab from "@/components/dashboard/OverviewTab";
import RiskTab from "@/components/dashboard/RiskTab";
import EquityTab from "@/components/dashboard/EquityTab";
import { METRIC_LABELS, ColorMetric } from "@/lib/dataLoader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Search, RotateCcw, MapPin } from "lucide-react";

export default function Index() {
  const {
    loading,
    error,
    villagesGeoJSON,
    allVillagesGeoJSON,
    unionsGeoJSON,
    filteredVillages,
    colorMetric,
    setColorMetric,
    selectedVillage,
    setSelectedVillage,
    searchQuery,
    setSearchQuery,
    resetFilters,
    kpis,
  } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading dashboard data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center text-destructive p-6">
          <p className="font-semibold">Error loading data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">
              Lama Family Card Impact Dashboard
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Bandarban · Chattogram Division · {filteredVillages.length} villages
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT: Map */}
        <div className="flex-1 relative min-w-0">
          {/* Map controls overlay */}
          <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
            <div className="bg-card rounded-lg shadow-lg border border-border p-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search village…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm outline-none w-44 placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={colorMetric}
              onChange={(e) => setColorMetric(e.target.value as ColorMetric)}
              className="bg-card rounded-lg shadow-lg border border-border p-2 text-xs outline-none cursor-pointer"
            >
              {Object.entries(METRIC_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  Color: {label}
                </option>
              ))}
            </select>
            {(searchQuery || selectedVillage) && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 bg-card rounded-lg shadow-lg border border-border p-2 text-xs text-primary hover:bg-secondary transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset filters
              </button>
            )}
          </div>

          {/* Color legend */}
          <div className="absolute bottom-4 left-3 z-[1000] bg-card rounded-lg shadow-lg border border-border p-2">
            <p className="text-[10px] text-muted-foreground mb-1">
              {METRIC_LABELS[colorMetric]}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-muted-foreground">Low</span>
              <div
                className="w-24 h-3 rounded-sm"
                style={{
                  background: "linear-gradient(to right, rgb(0,180,200), rgb(128,255,0), rgb(255,200,0), rgb(255,0,0))",
                }}
              />
              <span className="text-[9px] text-muted-foreground">High</span>
            </div>
          </div>

          {villagesGeoJSON && allVillagesGeoJSON && unionsGeoJSON && (
            <DashboardMap
              villagesGeoJSON={villagesGeoJSON}
              allVillagesGeoJSON={allVillagesGeoJSON}
              unionsGeoJSON={unionsGeoJSON}
              colorMetric={colorMetric}
              selectedVillage={selectedVillage}
              onSelectVillage={setSelectedVillage}
            />
          )}
        </div>

        {/* RIGHT: Panel */}
        <div className="w-[420px] border-l border-border bg-card overflow-y-auto shrink-0">
          <div className="p-4 space-y-4">
            <KPICards kpis={kpis} />

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="risk">Risk</TabsTrigger>
                <TabsTrigger value="equity">Equity</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                <OverviewTab villages={filteredVillages} />
              </TabsContent>
              <TabsContent value="risk" className="mt-4">
                <RiskTab villages={filteredVillages} />
              </TabsContent>
              <TabsContent value="equity" className="mt-4">
                <EquityTab villages={filteredVillages} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
