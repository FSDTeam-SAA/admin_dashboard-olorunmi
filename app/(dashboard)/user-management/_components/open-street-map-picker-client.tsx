"use client";

import { useEffect, useMemo } from "react";
import L, { type DragEndEvent } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

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

  return (
    <div className="overflow-hidden rounded-xl border border-[#dbdbdb]">
      <MapContainer center={mapCenter} zoom={DEFAULT_ZOOM} scrollWheelZoom className="h-[122px] w-full">
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
  );
}
