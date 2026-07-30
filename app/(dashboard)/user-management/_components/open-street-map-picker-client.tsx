"use client";

import { useEffect, useMemo, useState } from "react";
import L, { type DragEndEvent } from "leaflet";
import { Search } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEFAULT_ZOOM = 15;

type LocationSearchResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapCenterSync({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), { animate: true });
  }, [latitude, longitude, map]);

  return null;
}

function LocationPicker({
  onChange,
}: {
  onChange: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export default function OpenStreetMapPickerClient({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
}) {
  const mapCenter = useMemo<[number, number]>(() => [latitude, longitude], [latitude, longitude]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);

  const moveToSearchResult = (result: LocationSearchResult) => {
    const nextLatitude = Number(result.lat);
    const nextLongitude = Number(result.lon);

    if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) {
      setSearchError("No location found");
      return;
    }

    setSearchQuery(result.display_name ?? searchQuery);
    setSuggestions([]);
    setSearchError("");
    onChange(nextLatitude, nextLongitude);
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setSearchError("");
    }
  };

  const fetchLocationSuggestions = async (query: string, limit = 5) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=${limit}&q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error("Search failed");
    }

    return (await response.json()) as LocationSearchResult[];
  };

  const searchLocation = async () => {
    const query = searchQuery.trim();

    if (!query) {
      setSearchError("Enter a location to search");
      return;
    }

    setSearching(true);
    setSearchError("");

    try {
      const results = await fetchLocationSuggestions(query, 5);
      const result = results[0];

      if (!result) {
        setSearchError("No location found");
        return;
      }

      moveToSearchResult(result);
    } catch {
      setSearchError("Unable to search location");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < 3) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setSearching(true);
      setSearchError("");

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const results = (await response.json()) as LocationSearchResult[];
        setSuggestions(results);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setSuggestions([]);
        setSearchError("Unable to search location");
      } finally {
        setSearching(false);
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9a9a9a]" />
          <Input
            className="pl-9"
            placeholder="Search location"
            value={searchQuery}
            onChange={(event) => handleSearchQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                searchLocation();
              }
            }}
          />
        </div>
        <Button type="button" className="h-11 px-4" disabled={searching} onClick={searchLocation}>
          {searching ? "Searching..." : "Search"}
        </Button>
      </div>

      {suggestions.length ? (
        <div className="max-h-36 overflow-y-auto rounded-xl border border-[#dbdbdb] bg-white">
          {suggestions.map((result, index) => (
            <button
              key={`${result.lat}-${result.lon}-${index}`}
              type="button"
              className="block w-full border-b border-[#ededed] px-3 py-2 text-left text-xs text-[#383838] last:border-b-0 hover:bg-[#f5f2ea]"
              onClick={() => moveToSearchResult(result)}
            >
              {result.display_name ?? "Unnamed location"}
            </button>
          ))}
        </div>
      ) : null}

      {searchError ? <p className="text-xs text-red-500">{searchError}</p> : null}

      <div className="overflow-hidden rounded-xl border border-[#dbdbdb]">
        <MapContainer
          center={mapCenter}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
          className="h-[240px] w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <MapCenterSync latitude={latitude} longitude={longitude} />
          <LocationPicker onChange={onChange} />

          <Marker
            position={mapCenter}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend(event: DragEndEvent) {
                const marker = event.target as L.Marker;
                const position = marker.getLatLng();
                onChange(position.lat, position.lng);
              },
            }}
          />
        </MapContainer>
      </div>
    </div>
  );
}
