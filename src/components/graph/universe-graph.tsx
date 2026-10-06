"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { layoutGraph } from "@/lib/graph-layout";
import { RELATIONSHIP_TYPE_LABELS, type RelationshipType } from "@/lib/relationship-types";

// Forma de GET /api/v1/graph (copia local: el cliente no importa src/server).
export interface GraphData {
  nodes: { id: string; name: string; imageThumbUrl: string | null; state: string }[];
  edges: { source: string; target: string; type: RelationshipType | null; shared: number }[];
  locked: number;
}

type CharacterNodeData = { name: string; imageThumbUrl: string | null; collected: boolean };
type CharacterNode = Node<CharacterNodeData, "character">;
type LockedNode = Node<Record<string, never>, "locked">;

// Asas invisibles en el centro: las líneas salen y llegan al centro del nodo.
const centerHandle = "!left-1/2 !top-1/2 !h-1 !w-1 !min-h-0 !min-w-0 !border-0 !opacity-0";

function CharacterNodeView({ data }: NodeProps<CharacterNode>) {
  return (
    <div className="flex w-[72px] flex-col items-center gap-1 text-center">
      <div
        className={`relative h-14 w-14 overflow-hidden rounded-full border-2 bg-background ${
          data.collected ? "border-foreground" : "border-foreground/30"
        }`}
      >
        {data.imageThumbUrl && (
          <Image src={data.imageThumbUrl} alt="" fill unoptimized className="object-cover" />
        )}
      </div>
      <span className="rounded bg-background/80 px-1 text-[10px] font-medium leading-tight">
        {data.name}
      </span>
      <Handle type="target" position={Position.Top} className={centerHandle} />
      <Handle type="source" position={Position.Bottom} className={centerHandle} />
    </div>
  );
}

function LockedNodeView() {
  return (
    <div
      aria-label="Personaje por descubrir"
      className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-foreground/20 text-lg font-bold opacity-50"
    >
      ?
    </div>
  );
}

const nodeTypes = { character: CharacterNodeView, locked: LockedNodeView };

export function UniverseGraph({ data }: { data: GraphData }) {
  const { nodes, edges } = useMemo(() => {
    const { positions, radius } = layoutGraph(
      data.nodes.map((n) => n.id),
      data.edges,
    );

    const characterNodes: CharacterNode[] = data.nodes.map((n) => ({
      id: n.id,
      type: "character",
      position: positions.get(n.id)!,
      data: { name: n.name, imageThumbUrl: n.imageThumbUrl, collected: n.state === "COLLECTED" },
    }));

    // Siluetas en un anillo exterior, sin enlaces: no dan pistas de con quién se relacionan.
    const lockedNodes: LockedNode[] = Array.from({ length: data.locked }, (_, i) => {
      const angle = (2 * Math.PI * i) / data.locked;
      return {
        id: `locked-${i}`,
        type: "locked",
        position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
        data: {},
        draggable: false,
        selectable: false,
      };
    });

    const graphEdges: Edge[] = data.edges.map((e) => ({
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      type: "straight",
      label: e.type ? RELATIONSHIP_TYPE_LABELS[e.type] : undefined,
      // Curadas: línea continua; "aparecen juntos": discontinua y más suave.
      style: e.type ? { strokeWidth: 2 } : { strokeDasharray: "4 4", opacity: 0.5 },
    }));

    return { nodes: [...characterNodes, ...lockedNodes], edges: graphEdges };
  }, [data]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      colorMode="system"
      fitView
      minZoom={0.2}
      nodesConnectable={false}
    >
      <Background />
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable />
    </ReactFlow>
  );
}
