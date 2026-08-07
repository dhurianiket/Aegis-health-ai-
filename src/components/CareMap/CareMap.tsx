import React, { useEffect, useState, useRef } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import {
  MapPin,
  Search,
  Navigation,
  Phone,
  Star,
  Activity,
  Award,
  Loader2,
  Clock,
  Compass,
  AlertCircle,
} from "lucide-react";
import { useProfile } from "../../context/ProfileContext";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY.trim() !== "";

// Pre-defined default coordinates (e.g., Mount Sinai Hospital area, NY)
const DEFAULT_CENTER = { lat: 40.7893, lng: -73.9544 };

interface PlaceMarker {
  id: string;
  name: string;
  address: string;
  latLng: { lat: number; lng: number };
  rating?: number;
  type: string;
}

export default function CareMapContainer() {
  if (!hasValidKey) {
    return (
      <div className="bg-surface backdrop-blur-xl border border-surface p-8 rounded-[32px] max-w-2xl mx-auto shadow-2xl text-center my-12">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-6">
          <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: "12s" }} />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Localized Care Map
        </h3>
        <p className="text-muted text-sm max-w-md mx-auto mb-8 leading-relaxed">
          Unlock local healthcare discovery. Aegis routes clinical networks, medical specialists, diagnostic labs, and nearby emergency services directly to your region.
        </p>

        <div className="p-6 bg-black/15 border border-white/5 rounded-2xl text-left space-y-4 mb-8">
          <h4 className="text-xs uppercase tracking-widest font-extrabold text-indigo-400">
            Setup Instruction Guide
          </h4>
          <ol className="text-xs text-muted list-decimal list-inside space-y-2.5 leading-relaxed">
            <li>
              Obtain an API key from Google Cloud Console: <br />
              <a 
                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-400 underline hover:text-indigo-300 font-semibold"
              >
                Get Google Maps Platform API Key
              </a>
            </li>
            <li>In AI Studio, locate the <strong className="text-theme">Settings</strong> page (⚙️ gear icon, top-right panel).</li>
            <li>Select <strong className="text-theme">Secrets</strong> from the sub-menu.</li>
            <li>Add <code className="bg-slate-800 text-slate-100 px-1.5 py-0.5 rounded font-mono">GOOGLE_MAPS_PLATFORM_KEY</code> as the secret key.</li>
            <li>Paste your secret token as the value and press <kbd className="bg-slate-800 text-slate-100 px-1 py-0.5 rounded font-mono">Enter</kbd>.</li>
          </ol>
          <div className="text-xs text-faint border-t border-white/5 pt-3 leading-relaxed">
            The application executes instant developer updates, propagating your environment secrets without needing a browser reload.
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <CareMap />
    </APIProvider>
  );
}

function CareMap() {
  const map = useMap();
  const placesLib = useMapsLibrary("places");
  const routesLib = useMapsLibrary("routes");

  const { activeProfile } = useProfile();

  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(13);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("hospital");
  const [places, setPlaces] = useState<PlaceMarker[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceMarker | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Routes variables
  const [activeRoute, setActiveRoute] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Category presets
  const CATEGORIES = [
    { id: "hospital", label: "Hospitals", icon: Activity },
    { id: "pharmacy", label: "Pharmacies", icon: MapPin },
    { id: "diagnostic", label: "Diagnostics/Labs", icon: Award },
    { id: "clinic", label: "Primary Care", icon: Star },
  ];

  // Try to acquire device geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMapCenter(latLng);
          setHasPermission(true);
        },
        (err) => {
          console.warn("[CareMap] Geolocation access ignored/denied:", err);
          setHasPermission(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setHasPermission(false);
    }
  }, []);

  // Sync / Center map
  useEffect(() => {
    if (map && mapCenter) {
      map.panTo(mapCenter);
    }
  }, [map, mapCenter]);

  // Fetch / Query Places near current location
  const executeQuerySearch = (query: string, clearPrev = true) => {
    if (!placesLib || !map) return;

    setIsSearching(true);
    if (clearPrev) {
      setSelectedPlace(null);
      clearActiveRoute();
    }

    placesLib.Place.searchByText({
      textQuery: query,
      fields: ["id", "displayName", "location", "formattedAddress", "rating"],
      locationBias: mapCenter,
      maxResultCount: 12,
    })
      .then(({ places: results }) => {
        if (results && results.length > 0) {
          const formatted = results.map((p) => ({
            id: p.id,
            name: p.displayName || "Unknown Location",
            address: p.formattedAddress || "No Address Available",
            latLng: p.location ? { lat: p.location.lat(), lng: p.location.lng() } : DEFAULT_CENTER,
            rating: p.rating ?? undefined,
            type: activeCategory,
          }));
          setPlaces(formatted);

          // Fit viewport to cover all markers
          const bounds = new google.maps.LatLngBounds();
          formatted.forEach((f) => bounds.extend(f.latLng));
          bounds.extend(mapCenter); // Include user location
          map.fitBounds(bounds);
        } else {
          setPlaces([]);
        }
      })
      .catch((err) => {
        console.error("[CareMap] Place query lookup error:", err);
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  // Query on category switch
  useEffect(() => {
    if (!placesLib || !map) return;
    
    let textQuery = "hospital";
    if (activeCategory === "pharmacy") textQuery = "pharmacy";
    else if (activeCategory === "diagnostic") textQuery = "medical laboratory diagnostics";
    else if (activeCategory === "clinic") textQuery = "primary care doctor clinic";

    // Incorporate potential profile context!
    if (activeProfile?.gender === "female" && activeCategory === "clinic") {
      textQuery = "OBGYN clinic gynecologist";
    }

    executeQuerySearch(textQuery, true);
  }, [placesLib, map, activeCategory, mapCenter]);

  // Handle manual searching
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      executeQuerySearch(searchQuery, true);
    }
  };

  // Directions/compute routes
  const clearActiveRoute = () => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    setActiveRoute(null);
  };

  const calculateRoute = (destLatLng: { lat: number; lng: number }) => {
    if (!routesLib || !map) return;

    clearActiveRoute();

    routesLib.Route.computeRoutes({
      origin: mapCenter,
      destination: destLatLng,
      travelMode: "DRIVING",
      fields: ["path", "distanceMeters", "durationMillis", "viewport"],
    })
      .then(({ routes }) => {
        if (routes && routes[0]) {
          const route = routes[0];
          const newPolylines = route.createPolylines();
          
          // Style polylines beautifully to fit Aegis brand
          newPolylines.forEach((poly) => {
            poly.setOptions({
              strokeColor: "#6366f1", // purple/indigo
              strokeOpacity: 0.9,
              strokeWeight: 5,
            });
            poly.setMap(map);
          });
          polylinesRef.current = newPolylines;

          // Compute readable distance & duration
          const distM = route.distanceMeters ?? 0;
          const durMs = Number(route.durationMillis ?? 0);

          const distanceKM = (distM / 1000).toFixed(1);
          const durationMins = Math.round(durMs / 60000);

          setActiveRoute({
            distance: `${distanceKM} km`,
            duration: `${durationMins} mins driving`,
          });

          // Zoom to route bounds
          if (route.viewport) {
            map.fitBounds(route.viewport);
          }
        }
      })
      .catch((err) => {
        console.error("[CareMap] Routes compute failed:", err);
      });
  };

  // Triggers whenever a place is clicked/selected
  const handleSelectPlace = (place: PlaceMarker) => {
    setSelectedPlace(place);
    calculateRoute(place.latLng);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-140px)] relative">
      {/* Side Panel: Location List & Controls */}
      <div className="lg:col-span-4 flex flex-col space-y-4 h-full pointer-events-auto">
        <div className="bg-surface border border-surface p-6 rounded-[28px] shadow-xl flex flex-col space-y-4">
          <form onSubmit={handleManualSearch} className="relative">
            <input
              type="text"
              placeholder="Search local clinics, labs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-bg)] text-theme placeholder-slate-400 border border-[var(--color-border)] rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Location status badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-xs text-indigo-400 font-semibold justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {hasPermission ? "Device GPS Active" : "Fallback Search Anchor"}
            </span>
            <button 
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                  });
                }
              }}
              className="text-xs underline hover:text-indigo-300 pointer-events-auto"
            >
              Recenter
            </button>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold transition-all border ${
                    isActive
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                      : "bg-surface border-surface hover:bg-slate-800 text-theme"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Clinical Card / Directions details */}
        {selectedPlace && (
          <div className="bg-surface border-2 border-indigo-500 p-6 rounded-[28px] shadow-xl space-y-4 relative">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-bold text-xs uppercase tracking-wider block w-fit mb-1.5">
                  SELECTED PROVIDER
                </span>
                <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  {selectedPlace.name}
                </h4>
                <p className="text-xs text-muted font-light mt-1 max-w-[240px]">
                  {selectedPlace.address}
                </p>
              </div>
              
              {selectedPlace.rating && (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs font-bold shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  {selectedPlace.rating}
                </div>
              )}
            </div>

            {/* Directions overlay card */}
            {activeRoute && (
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs text-indigo-400 uppercase tracking-widest font-extrabold">
                    ESTIMATED ROUTE DISTANCE
                  </div>
                  <div className="text-sm font-bold text-theme">
                    {activeRoute.distance} · {activeRoute.duration}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4" />
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedPlace(null)}
              className="w-full py-2.5 text-center bg-black/10 hover:bg-black/20 text-xs font-bold uppercase text-theme tracking-wider rounded-xl transition-colors pointer-events-auto"
            >
              Close Details
            </button>
          </div>
        )}

        {/* Places List View */}
        <div className="bg-surface border border-surface rounded-[28px] shadow-xl p-4 flex-1 flex flex-col min-h-[250px] lg:min-h-0 lg:max-h-[350px] overflow-hidden">
          <div className="text-xs uppercase font-bold text-faint tracking-wider mb-3 px-2">
            Nearby Facilities ({places.length})
          </div>

          {isSearching ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              <span className="text-xs text-muted">Locating providers...</span>
            </div>
          ) : places.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="w-8 h-8 text-slate-300 opacity-35 mb-2" />
              <span className="text-xs text-muted">No medical providers detected near this area.</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {places.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handleSelectPlace(place)}
                  className={`w-full text-left p-3 rounded-2xl flex items-center justify-between gap-3 border transition-all pointer-events-auto ${
                    selectedPlace?.id === place.id
                      ? "bg-indigo-500/10 border-indigo-500/40 shadow-sm"
                      : "bg-black/5 hover:bg-black/10 border-transparent text-slate-800 dark:text-slate-200 font-semibold"
                  }`}
                >
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs truncate text-[var(--color-text)]">
                      {place.name}
                    </h5>
                    <p className="text-xs text-muted truncate mt-0.5 font-light">
                      {place.address}
                    </p>
                  </div>

                  <span className="p-1 px-2.5 bg-black/15 group-hover:bg-black/20 text-xs font-bold tracking-wider rounded-full uppercase text-indigo-400 shrink-0">
                    Route
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Display View */}
      <div className="lg:col-span-8 bg-surface border border-surface p-2 rounded-[32px] h-[450px] lg:h-auto shadow-2xl relative overflow-hidden flex flex-col">
        <div className="w-full h-full relative" style={{ minHeight: "100%" }}>
          <Map
            defaultCenter={mapCenter}
            defaultZoom={zoom}
            center={mapCenter}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            style={{ width: "100%", height: "100%" }}
            gestureHandling="greedy"
          >
            {/* User markerpin */}
            <AdvancedMarker position={mapCenter} title="Your Location">
              <Pin background="#e11d48" glyphColor="#fff" borderColor="#e11d48">
                <span className="text-xs font-bold">You</span>
              </Pin>
            </AdvancedMarker>

            {/* Places clinical markers */}
            {places.map((place) => {
              const isSelected = selectedPlace?.id === place.id;
              return (
                <AdvancedMarker
                  key={place.id}
                  position={place.latLng}
                  title={place.name}
                  onClick={() => handleSelectPlace(place)}
                >
                  <Pin
                    background={isSelected ? "#6366f1" : "#4f46e5"}
                    glyphColor="#fff"
                    borderColor={isSelected ? "#4f46e5" : "#3730a3"}
                  />
                </AdvancedMarker>
              );
            })}
          </Map>
        </div>
      </div>
    </div>
  );
}
