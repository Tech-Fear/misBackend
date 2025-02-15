import graphlib from "graphlib";

const { Graph } = graphlib;

export const buildCapacitatedGraph = (shuttles, isPeakHour) => {
  const graph = new Graph({ directed: true });

  shuttles.forEach((shuttle) => {
    if (!shuttle.route || !shuttle.route.stops) {
      console.error(`Error: Shuttle ${shuttle.name} has no valid route.`);
      return;
    }

    const stops = isPeakHour
      ? [...shuttle.route.stops, ...(shuttle.route.peakHourStops || [])]
      : shuttle.route.stops;

    stops.forEach((stop, index) => {
      if (!stop || !stop.stopName) return;
      const nodeName = `${shuttle.name}_${stop.stopName}`;
      graph.setNode(nodeName, { lat: stop.lat, lng: stop.lng });

      if (index < stops.length - 1) {
        const nextStop = stops[index + 1];
        if (!nextStop || !nextStop.stopName) return;

        const nextNode = `${shuttle.name}_${nextStop.stopName}`;
        const distance = Math.sqrt(
          Math.pow(stop.lat - nextStop.lat, 2) +
            Math.pow(stop.lng - nextStop.lng, 2)
        );

        graph.setEdge(nodeName, nextNode, {
          cost: distance * 2,
          transfers: 0,
          capacity: shuttle.availableSeats,
        });
      }
    });
  });

  shuttles.forEach((shuttle1) => {
    if (!shuttle1.route || !shuttle1.route.stops) return;

    shuttle1.route.stops.forEach((stop1) => {
      if (!stop1 || !stop1.stopName) return;

      shuttles.forEach((shuttle2) => {
        if (
          shuttle1.name !== shuttle2.name &&
          shuttle2.route &&
          shuttle2.route.stops
        ) {
          shuttle2.route.stops.forEach((stop2) => {
            if (!stop2 || !stop2.stopName) return;

            if (stop1.stopName === stop2.stopName) {
              const nodeA = `${shuttle1.name}_${stop1.stopName}`;
              const nodeB = `${shuttle2.name}_${stop2.stopName}`;
              graph.setEdge(nodeA, nodeB, {
                cost: 5,
                transfers: 1,
                capacity: 1,
              });
            }
          });
        }
      });
    });
  });

  return graph;
};

export const minCostMaxFlow = (graph, sources, sinks) => {
  let maxFlow = 0;
  let minCost = 0;
  let flowPath = [];

  sources.forEach((source) => {
    sinks.forEach((sink) => {
      const { path, cost, flow } = dijkstraWithCapacity(graph, source, sink);
      if (flow > 0) {
        maxFlow += flow;
        minCost += cost * flow;
        flowPath.push({ path, flow });
      }
    });
  });

  return { maxFlow, minCost, flowPath };
};

const dijkstraWithCapacity = (graph, source, sink) => {
  if (!graph.hasNode(source) || !graph.hasNode(sink)) {
    return { path: [], cost: Infinity, flow: 0 };
  }

  const nodes = graph.nodes();
  const dist = {};
  const prev = {};
  const capacity = {};
  const pq = [[0, source]];

  nodes.forEach((node) => {
    dist[node] = Infinity;
    capacity[node] = 0;
  });
  dist[source] = 0;
  capacity[source] = Infinity;

  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [cost, node] = pq.shift();
    if (node === sink) break;

    graph.successors(node).forEach((neighbor) => {
      const edge = graph.edge(node, neighbor);
      if (!edge) return;

      const availableCapacity = Math.min(capacity[node], edge.capacity);
      const newCost = cost + edge.cost;

      if (availableCapacity > 0 && newCost < dist[neighbor]) {
        dist[neighbor] = newCost;
        capacity[neighbor] = availableCapacity;
        prev[neighbor] = node;
        pq.push([newCost, neighbor]);
      }
    });
  }

  const path = [];
  let current = sink;
  while (current) {
    path.unshift(current);
    current = prev[current];
  }

  return { path, cost: dist[sink], flow: capacity[sink] };
};

export const floydWarshall = async (shuttles) => {
  const graph = {};
  shuttles.forEach((shuttle) => {
    if (!shuttle.route || !shuttle.route.stops) return;

    shuttle.route.stops.forEach((stop) => {
      if (!stop || !stop.stopName) return;
      graph[stop.stopName] = graph[stop.stopName] || {};

      shuttle.route.stops.forEach((nextStop) => {
        if (!nextStop || !nextStop.stopName) return;
        if (stop.stopName !== nextStop.stopName) {
          const distance = Math.sqrt(
            Math.pow(stop.lat - nextStop.lat, 2) +
              Math.pow(stop.lng - nextStop.lng, 2)
          );
          graph[stop.stopName][nextStop.stopName] = distance;
        }
      });
    });
  });

  const nodes = Object.keys(graph);
  const dist = {};
  const next = {};

  nodes.forEach((node) => {
    dist[node] = {};
    next[node] = {};
    nodes.forEach((neighbor) => {
      dist[node][neighbor] =
        node === neighbor ? 0 : graph[node]?.[neighbor] || Infinity;
      next[node][neighbor] = neighbor;
    });
  });

  nodes.forEach((k) => {
    nodes.forEach((i) => {
      nodes.forEach((j) => {
        if (dist[i][j] > dist[i][k] + dist[k][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
          next[i][j] = next[i][k];
        }
      });
    });
  });

  return { dist, next };
};

export const getAPSPRoute = (apspData, start, end) => {
  if (!apspData.next[start] || !apspData.next[start][end]) return null;
  let path = [start];
  let step = start;
  while (step !== end) {
    step = apspData.next[step][end];
    path.push(step);
  }
  return { path, cost: apspData.dist[start][end] };
};

export const findNearestStop = (shuttles, userLat, userLng) => {
  let nearestStop = null;
  let minDistance = Infinity;

  shuttles.forEach((shuttle) => {
    if (!shuttle.route || !shuttle.route.stops) return;

    shuttle.route.stops.forEach((stop) => {
      if (!stop || !stop.stopName) return;

      const distance = Math.sqrt(
        Math.pow(userLat - stop.lat, 2) + Math.pow(userLng - stop.lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestStop = stop.stopName;
      }
    });
  });

  return nearestStop;
};
