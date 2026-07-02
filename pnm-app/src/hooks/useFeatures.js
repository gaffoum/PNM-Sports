import { useContext } from "react";
import { FeatureContext } from "../contexts/FeatureContext";

export function useFeatures() {
  const ctx = useContext(FeatureContext);
  if (!ctx) throw new Error("useFeatures must be used inside <FeatureProvider>");
  return ctx;
}
