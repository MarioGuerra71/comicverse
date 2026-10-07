"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
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
  focus: string | null;
}

type CharacterNodeData = {
  name: string;
  imageThumbUrl: string | null;
  collected: boolean;
  isFocus: boolean;
};
type CharacterNode = Node<CharacterNodeData, "character">;
type LockedNode = Node<Record<string, never>, "locked">;

// Asas invisibles en el centro: las líneas salen y llegan al centro del nodo.
const centerHandle = "!left-1/2 !top-1/2 !h-1 !w-1 !min-h-0 !min-w-0 !border-0 !opacity-0";

function CharacterNodeView({ data }: NodeProps<CharacterNode>) {
  return (
    <div className="flex w-[72px] cursor-pointer flex-col items-center gap-1 text-center">
      <div
        // Viñeta entintada; coleccionado = filete más grueso; foco = recuadro del editor.
        className={`relative h-[72px] w-14 overflow-hidden border-ink bg-sheet ${
          data.collected ? "border-[3px]" : "border-2"
        } ${data.isFocus ? "outline-2 outline-offset-4 outline-editor" : ""}`}
      >
        {data.imageThumbUrl && (
          <Image src={data.imageThumbUrl} alt="" fill unoptimized className="object-cover" />
        )}
      </div>
      <span className="bg-paper px-1 text-[10px] leading-tight font-bold text-ink">
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
      // Hueco a lápiz azul con su aspa, como las viñetas por descubrir de la colección.
      className="h-[72px] w-14 border-[1.5px] border-blue bg-sheet"
    >
      <svg viewBox="0 0 56 72" className="h-full w-full text-blue" aria-hidden="true">
        <path d="M0 0 56 72M56 0 0 72" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}

const nodeTypes = { character: CharacterNodeView, locked: LockedNodeView };

export function UniverseGraph({ data }: { data: GraphData }) {
  const router = useRouter();
  const { nodes, edges } = useMemo(() => {
    const { positions, radius } = layoutGraph(
      data.nodes.map((n) => n.id),
      data.edges,
    );

    const characterNodes: CharacterNode[] = data.nodes.map((n) => ({
      id: n.id,
      type: "character",
      position: positions.get(n.id)!,
      data: {
        name: n.name,
        imageThumbUrl: n.imageThumbUrl,
        collected: n.state === "COLLECTED",
        isFocus: n.id === data.focus,
      },
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
      // Curadas: línea de tinta continua con su tipo a mano; "aparecen juntos": discontinua.
      style: e.type
        ? { stroke: "var(--ink)", strokeWidth: 2 }
        : { stroke: "var(--line-strong)", strokeDasharray: "4 4" },
      labelStyle: { fill: "var(--editor-ink)", fontFamily: "var(--font-caveat)", fontSize: 15, fontWeight: 700 },
      labelBgStyle: { fill: "var(--paper)" },
    }));

    return { nodes: [...characterNodes, ...lockedNodes], edges: graphEdges };
  }, [data]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      colorMode="light"
      fitView
      minZoom={0.2}
      nodesConnectable={false}
      // Tocar un personaje abre su ficha (las siluetas no hacen nada).
      onNodeClick={(_, node) => {
        if (node.type === "character") router.push(`/characters/${node.id}`);
      }}
    >
      {/* Papel liso: sin retícula de fondo (ver DESIGN.md, "Plain Paper"). */}
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable nodeColor="#55534d" maskColor="rgb(244 241 234 / 0.7)" />
    </ReactFlow>
  );
}
