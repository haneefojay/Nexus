"use client";

import { Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Component, ReactNode, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type NodeData = {
  position: [number, number, number];
  status: "healthy" | "warning" | "critical";
  name: string;
};

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <NetworkFallback /> : this.props.children;
  }
}

function NetworkFallback() {
  return (
    <div className="network-fallback" aria-hidden="true">
      <div className="fallback-plane">
        {Array.from({ length: 54 }, (_, index) => (
          <i
            key={index}
            className={index % 13 === 0 ? "risk" : index % 9 === 0 ? "hub" : ""}
            style={{
              left: `${4 + ((index * 23) % 92)}%`,
              top: `${6 + ((index * 41) % 86)}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 9283.13 + salt * 77.7) * 43758.5453;
  return value - Math.floor(value);
}

function InfrastructureNetwork({ onSelect }: { onSelect: (node: NodeData | null) => void }) {
  const group = useRef<THREE.Group>(null);
  const nodes = useMemo<NodeData[]>(
    () =>
      Array.from({ length: 68 }, (_, index) => {
        const angle = seeded(index, 1) * Math.PI * 2;
        const radius = 1.7 + seeded(index, 2) * 5.4;
        const x = Math.cos(angle) * radius * 1.35;
        const z = Math.sin(angle) * radius;
        const y = (Math.sin(x * 0.55) + Math.cos(z * 0.68)) * 0.22;
        const risk = seeded(index, 3);
        return {
          position: [x, y, z],
          status: risk > 0.91 ? "critical" : risk > 0.76 ? "warning" : "healthy",
          name: `NX-${String(2400 + index).padStart(4, "0")}`,
        };
      }),
    [],
  );

  const links = useMemo(
    () =>
      nodes.slice(1).map((node, index) => {
        const candidates = nodes
          .slice(0, index + 1)
          .map((other, otherIndex) => ({
            other,
            otherIndex,
            distance: new THREE.Vector3(...node.position).distanceTo(
              new THREE.Vector3(...other.position),
            ),
          }))
          .sort((a, b) => a.distance - b.distance);
        return [node.position, candidates[0].other.position] as [
          [number, number, number],
          [number, number, number],
        ];
      }),
    [nodes],
  );

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      state.pointer.x * 0.08,
      0.035,
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -state.pointer.y * 0.035,
      0.035,
    );
  });

  return (
    <group ref={group} rotation={[-0.1, -0.18, 0]}>
      <gridHelper args={[24, 38, "#1e2b24", "#111a15"]} position={[0, -0.52, 0]} />
      {links.map((points, index) => (
        <Line
          key={index}
          points={points}
          color={index % 8 === 0 ? "#799d28" : "#20332a"}
          lineWidth={index % 8 === 0 ? 1.2 : 0.55}
          transparent
          opacity={index % 8 === 0 ? 0.9 : 0.7}
        />
      ))}
      {nodes.map((node, index) => {
        const color =
          node.status === "critical"
            ? "#ff6b57"
            : node.status === "warning"
              ? "#f5a742"
              : index % 7 === 0
                ? "#b9f227"
                : "#7b9685";
        const scale = node.status === "critical" ? 0.14 : node.status === "warning" ? 0.1 : 0.065;
        return (
          <mesh
            key={node.name}
            position={node.position}
            onPointerOver={(event) => {
              event.stopPropagation();
              document.body.style.cursor = "crosshair";
              onSelect(node);
            }}
            onPointerOut={() => {
              document.body.style.cursor = "default";
              onSelect(null);
            }}
          >
            <sphereGeometry args={[scale, 12, 12]} />
            <meshBasicMaterial color={color} toneMapped={false} />
            {(node.status !== "healthy" || index % 11 === 0) && (
              <pointLight color={color} intensity={2.8} distance={1.2} />
            )}
          </mesh>
        );
      })}
      <mesh position={[0, -0.54, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 24, 1, 1]} />
        <meshBasicMaterial color="#070a09" transparent opacity={0.54} />
      </mesh>
    </group>
  );
}

export function NetworkScene() {
  const [selected, setSelected] = useState<NodeData | null>(null);

  return (
    <div className="network-scene" aria-label="Interactive 3D infrastructure network">
      <SceneBoundary>
        <Canvas
          camera={{ position: [0, 7.5, 9.5], fov: 42 }}
          dpr={[1, 1.6]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <fog attach="fog" args={["#070a09", 8, 20]} />
          <ambientLight intensity={0.8} />
          <InfrastructureNetwork onSelect={setSelected} />
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={0.68}
            maxPolarAngle={1.25}
            autoRotate
            autoRotateSpeed={0.12}
          />
        </Canvas>
      </SceneBoundary>
      <div className="scene-index">
        <span>34.0522° N</span>
        <span>NETWORK / WEST</span>
      </div>
      <div className={`asset-tooltip ${selected ? "is-visible" : ""}`}>
        <div>
          <span className={`status-dot ${selected?.status}`} />
          {selected?.status || "healthy"}
        </div>
        <strong>{selected?.name || "NX-2471"}</strong>
        <small>Power relay · Illustrative network</small>
      </div>
    </div>
  );
}
