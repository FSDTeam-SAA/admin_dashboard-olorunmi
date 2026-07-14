"use client";

import { useMemo } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer } from "react-leaflet";

const DEFAULT_ZOOM = 15;

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function UserLocationMapClient({
  latitude,
  longitude,
  radius,
  heightClassName = "h-[220px]",
}: {
  latitude: number;
  longitude: number;
  radius?: number;
  heightClassName?: string;
}) {
  const center = useMemo<[number, number]>(() => [latitude, longitude], [latitude, longitude]);

  return (
    <div className="overflow-hidden rounded-xl border border-[#dfdfdf]">
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        dragging
        className={`${heightClassName} w-full`}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <Marker position={center} icon={markerIcon} />

        {radius && radius > 0 ? (
          <Circle
            center={center}
            radius={radius}
            pathOptions={{ color: "#a79663", fillColor: "#a79663", fillOpacity: 0.15 }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
