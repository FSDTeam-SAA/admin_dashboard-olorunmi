"use client";

import dynamic from "next/dynamic";

type OpenStreetMapPickerProps = {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
};

const OpenStreetMapPickerClient = dynamic(
  () => import("./open-street-map-picker-client"),
  {
    ssr: false,
  }
);

export function OpenStreetMapPicker(props: OpenStreetMapPickerProps) {
  return <OpenStreetMapPickerClient {...props} />;
}

