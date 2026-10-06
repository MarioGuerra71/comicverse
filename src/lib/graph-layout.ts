import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationNodeDatum,
} from "d3-force";

export const NODE_SIZE = 72;

type SimNode = SimulationNodeDatum & { id: string };

/**
 * Posiciones del grafo con una simulación de fuerzas (se ejecuta de golpe, sin animar):
 * los enlaces atraen, los nodos se repelen y no se solapan.
 * `radius` deja fuera de todos los nodos un anillo para las siluetas bloqueadas.
 */
export function layoutGraph(nodeIds: string[], edges: { source: string; target: string }[]) {
  const simNodes: SimNode[] = nodeIds.map((id) => ({ id }));
  const simLinks = edges.map((e) => ({ source: e.source, target: e.target }));

  forceSimulation(simNodes)
    .force("link", forceLink<SimNode, (typeof simLinks)[number]>(simLinks).id((d) => d.id).distance(140))
    .force("charge", forceManyBody().strength(-500))
    .force("center", forceCenter(0, 0))
    .force("collide", forceCollide(NODE_SIZE * 0.8))
    .stop()
    .tick(300);

  const positions = new Map(simNodes.map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]));
  const radius =
    Math.max(200, ...simNodes.map((n) => Math.hypot(n.x ?? 0, n.y ?? 0))) + NODE_SIZE * 2;
  return { positions, radius };
}
