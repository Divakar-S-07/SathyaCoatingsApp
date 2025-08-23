import React from "react";
import Svg, { Path, Polyline } from "react-native-svg";

export default function PackageIcon({ size = 24, color = "teal" }) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <Path d="M12 22V12" />
      <Polyline points="3.29 7 12 12 20.71 7" />
      <Path d="m7.5 4.27 9 5.15" />
    </Svg>
  );
}
