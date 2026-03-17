"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import ThreeGlobe from "three-globe";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import countries from "@/data/globe.json";

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

export default function World({ globeConfig, data }: WorldProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialization
    const Globe = new ThreeGlobe()
      .hexPolygonsData(countries.features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .showAtmosphere(globeConfig.showAtmosphere !== false)
      .atmosphereColor(globeConfig.atmosphereColor || "#ffffff")
      .atmosphereAltitude(globeConfig.atmosphereAltitude || 0.1)
      .hexPolygonColor(() => globeConfig.polygonColor || "rgba(255,255,255,0.7)");

    // Arcs
    Globe.arcsData(data)
      .arcStartLat((d: any) => d.startLat)
      .arcStartLng((d: any) => d.startLng)
      .arcEndLat((d: any) => d.endLat)
      .arcEndLng((d: any) => d.endLng)
      .arcColor((e: any) => e.color)
      .arcAltitude((e: any) => e.arcAlt)
      .arcStroke(() => [0.32, 0.28, 0.3][Math.round(Math.random() * 2)])
      .arcDashLength(globeConfig.arcLength || 0.9)
      .arcDashInitialGap((e: any) => e.order)
      .arcDashGap(15)
      .arcDashAnimateTime(() => globeConfig.arcTime || 2000);

    // Points
    const points = [];
    data.forEach(arc => {
      points.push({ lat: arc.startLat, lng: arc.startLng, color: arc.color, order: arc.order });
      points.push({ lat: arc.endLat, lng: arc.endLng, color: arc.color, order: arc.order });
    });
    
    Globe.pointsData(points)
      .pointColor((e: any) => e.color)
      .pointsMerge(true)
      .pointAltitude(0.0)
      .pointRadius(2);

    // Set globe material
    const globeMaterial = Globe.globeMaterial() as any;
    globeMaterial.color = new THREE.Color(globeConfig.globeColor || "#1d072e");
    globeMaterial.emissive = new THREE.Color(globeConfig.emissive || "#000000");
    globeMaterial.emissiveIntensity = globeConfig.emissiveIntensity || 0.1;
    globeMaterial.shininess = globeConfig.shininess || 0.9;

    // Setup scene
    const scene = new THREE.Scene();
    scene.add(Globe);
    scene.add(new THREE.AmbientLight(globeConfig.ambientLight || "#38bdf8", 0.6));
    
    const dLight = new THREE.DirectionalLight(globeConfig.directionalTopLight || "#ffffff", 0.8);
    dLight.position.set(-200, 500, 200);
    scene.add(dLight);

    const pLight = new THREE.PointLight(globeConfig.pointLight || "#ffffff", 0.8);
    pLight.position.set(-200, 500, 200);
    scene.add(pLight);

    // Initial Camera
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, aspect, 1, 10000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    const { clientWidth, clientHeight } = containerRef.current;
    renderer.setSize(clientWidth, clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.autoRotate = globeConfig.autoRotate !== false;
    controls.autoRotateSpeed = globeConfig.autoRotateSpeed || 0.5;

    // Animation Loop
    let animationId: number;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [data, globeConfig]);

  return <div ref={containerRef} className="w-full h-full" />;
}
