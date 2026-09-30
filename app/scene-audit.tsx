"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Box3, Raycaster, Vector3 } from "three";
import type { Mesh, Object3D } from "three";

export type AuditFinding = { kind: "floating" | "inverted" | "buried"; name: string; path: string; position: [number, number, number]; size: [number, number, number]; gap?: number };

const path = (object: Object3D) => {
  const parts: string[] = [];
  let node: Object3D | null = object;
  while (node && parts.length < 5) {
    parts.push(node.name || node.type);
    node = node.parent;
  }
  return parts.join(" < ");
};

/**
 * Development audit: reports small props with air beneath them and cones/spikes pointing down.
 * Run `window.__templeAudit()` in the console; nothing runs during normal rendering.
 */
export function SceneAudit() {
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    const target = window as unknown as { __templeAudit?: (options?: { maxSize?: number; tolerance?: number }) => AuditFinding[] };
    target.__templeAudit = ({ maxSize = 7, tolerance = 0.06 } = {}) => {
      scene.updateMatrixWorld(true);
      const solids: Mesh[] = [];
      scene.traverse((object) => {
        const mesh = object as Mesh;
        if (!mesh.isMesh || !object.visible || object.userData.auditIgnore) return;
        const material = mesh.material as { transparent?: boolean; opacity?: number } | undefined;
        if (material?.transparent && (material.opacity ?? 1) < 0.95) return;
        let ancestor: Object3D | null = object;
        while (ancestor) {
          if (!ancestor.visible) return;
          ancestor = ancestor.parent;
        }
        solids.push(mesh);
      });
      const raycaster = new Raycaster();
      const down = new Vector3(0, -1, 0);
      const box = new Box3();
      const size = new Vector3();
      const center = new Vector3();
      const findings: AuditFinding[] = [];
      const supports = solids.filter((mesh) => {
        mesh.geometry.computeBoundingBox();
        box.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld);
        box.getSize(size);
        return size.x < 900;
      });
      for (const mesh of solids) {
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        box.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld);
        box.getSize(size);
        box.getCenter(center);
        if (Math.max(size.x, size.y, size.z) > maxSize || Math.max(size.x, size.y, size.z) < 0.03) continue;
        const geometryType = mesh.geometry.type;
        if (geometryType === "ConeGeometry") {
          const tip = new Vector3(0, 1, 0).transformDirection(mesh.matrixWorld);
          if (tip.y < -0.5) findings.push({ kind: "inverted", name: mesh.name || geometryType, path: path(mesh), position: [center.x, center.y, center.z].map((v) => +v.toFixed(2)) as [number, number, number], size: [size.x, size.y, size.z].map((v) => +v.toFixed(2)) as [number, number, number] });
        }
        raycaster.set(new Vector3(center.x, box.min.y + 0.01, center.z), down);
        raycaster.far = 40;
        const hits = raycaster.intersectObjects(supports.filter((other) => other !== mesh && !mesh.getObjectById(other.id) && !other.getObjectById(mesh.id)), false);
        const hit = hits[0];
        const gap = hit ? hit.distance - 0.01 : 99;
        if (gap > tolerance) {
          findings.push({ kind: "floating", name: mesh.name || geometryType, path: path(mesh), position: [center.x, center.y, center.z].map((v) => +v.toFixed(2)) as [number, number, number], size: [size.x, size.y, size.z].map((v) => +v.toFixed(2)) as [number, number, number], gap: +gap.toFixed(2) });
        }
      }
      return findings;
    };
    return () => {
      delete target.__templeAudit;
    };
  }, [scene]);
  return null;
}
