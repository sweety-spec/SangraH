"use client";

import dynamic from "next/dynamic";

export const NextClientApp = dynamic(
  () => import("../../client/src/App").then((mod) => mod.ClientApp),
  { ssr: false }
);
