import React, { Suspense, lazy, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchStorageProviders, StorageProvider } from "@/lib/shelby-nodes";

const World = lazy(() => import("@/components/ui/globe"));

export default function GlobeDemo() {
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProviders = async () => {
      const data = await fetchStorageProviders();
      setProviders(data);
      setLoading(false);
    };
    loadProviders();
  }, []);

  const globeConfig = {
    pointSize: 4,
    globeColor: "#000510",
    showAtmosphere: true,
    atmosphereColor: "#4cc9f0",
    atmosphereAltitude: 0.15,
    emissive: "#000510",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    polygonColor: "rgba(76, 201, 240, 0.5)",
    ambientLight: "#4cc9f0",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    initialPosition: { lat: 22.3193, lng: 114.1694 },
    autoRotate: true,
    autoRotateSpeed: 0.5,
  };

  // Specific coordinates for the requested countries
  const countryCoords = {
    Germany: { lat: 51.1657, lng: 10.4515 },
    Netherlands: { lat: 52.3676, lng: 4.9041 },
    UK: { lat: 51.5074, lng: -0.1278 },
    France: { lat: 48.8566, lng: 2.3522 },
    USA: { lat: 37.0902, lng: -95.7129 },
  };

  // Generate arcs connecting these specific countries
  const sampleArcs = [
    { order: 1, startLat: countryCoords.Germany.lat, startLng: countryCoords.Germany.lng, endLat: countryCoords.USA.lat, endLng: countryCoords.USA.lng, arcAlt: 0.3, color: "#4cc9f0" },
    { order: 2, startLat: countryCoords.Netherlands.lat, startLng: countryCoords.Netherlands.lng, endLat: countryCoords.UK.lat, endLng: countryCoords.UK.lng, arcAlt: 0.1, color: "#4cc9f0" },
    { order: 3, startLat: countryCoords.France.lat, startLng: countryCoords.France.lng, endLat: countryCoords.Germany.lat, endLng: countryCoords.Germany.lng, arcAlt: 0.2, color: "#4cc9f0" },
    { order: 4, startLat: countryCoords.UK.lat, startLng: countryCoords.UK.lng, endLat: countryCoords.USA.lat, endLng: countryCoords.USA.lng, arcAlt: 0.4, color: "#4cc9f0" },
    { order: 5, startLat: countryCoords.USA.lat, startLng: countryCoords.USA.lng, endLat: countryCoords.France.lat, endLng: countryCoords.France.lng, arcAlt: 0.5, color: "#4cc9f0" },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-24 min-h-[600px] md:h-auto bg-transparent relative w-full overflow-hidden">
      <div className="max-w-7xl mx-auto w-full relative h-[40rem] md:h-[45rem] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-20"
        >
          <div className="flex flex-col items-center justify-center">
            <div className="px-3 py-1 mb-4 rounded-full border border-primary/20 bg-primary/5 text-[10px] md:text-xs font-medium text-primary flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Live Storage Network
            </div>
            <h2 className="text-center text-2xl md:text-5xl font-bold text-black dark:text-white tracking-tight">
              Securing Data Worldwide
            </h2>
            <p className="text-center text-sm md:text-lg font-normal text-neutral-600 dark:text-neutral-400 max-w-xl mt-4 mx-auto leading-relaxed">
              Real-time visualization of {providers.length || "active"} Storage Providers across the Shelby Testnet. 
              {loading ? " Fetching network state..." : " Your data is decentralized and globally distributed."}
            </p>
          </div>
        </motion.div>
        
        <div className="absolute w-full bottom-0 inset-x-0 h-40 bg-gradient-to-b pointer-events-none select-none from-transparent dark:to-black to-white z-40" />
        
        <div className="absolute w-full -bottom-12 md:-bottom-20 h-[32rem] md:h-full z-10">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }>
            {!loading && <World data={sampleArcs} globeConfig={globeConfig} />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
