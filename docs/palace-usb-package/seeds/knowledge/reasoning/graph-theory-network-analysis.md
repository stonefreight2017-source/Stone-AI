# Graph Theory & Network Analysis

## Purpose
Graphs are the mathematical structure behind knowledge graphs, social networks, dependency trees, and PageRank. Every GraphRAG implementation, every entity relationship model, and every network analysis task relies on graph theory. This seed covers nodes, edges, paths, centrality, PageRank, community detection, and shortest path algorithms — with Python examples and direct applications to RAG and knowledge systems.

---

## Graph Fundamentals

### Definitions
- **Graph G = (V, E)**: A set of vertices (nodes) V and edges (connections) E
- **Directed graph**: Edges have direction (A → B is different from B → A)
- **Undirected graph**: Edges have no direction (A — B)
- **Weighted graph**: Edges have numerical weights (costs, distances, strengths)
- **Degree**: Number of edges connected to a node
- **Path**: Sequence of nodes connected by edges
- **Cycle**: A path that starts and ends at the same node
- **Connected**: Every node can reach every other node

### Representation

```python
import numpy as np
from collections import defaultdict, deque
import heapq

class Graph:
    def __init__(self, directed=False):
        self.adjacency = defaultdict(dict)  # node → {neighbor: weight}
        self.directed = directed

    def add_edge(self, u, v, weight=1.0):
        self.adjacency[u][v] = weight
        if not self.directed:
            self.adjacency[v][u] = weight
        # Ensure both nodes exist
        if u not in self.adjacency:
            self.adjacency[u] = {}
        if v not in self.adjacency:
            self.adjacency[v] = {}

    def neighbors(self, node):
        return self.adjacency.get(node, {})

    def nodes(self):
        return list(self.adjacency.keys())

    def degree(self, node):
        return len(self.adjacency.get(node, {}))

    def edge_count(self):
        total = sum(len(neighbors) for neighbors in self.adjacency.values())
        return total if self.directed else total // 2

# Example: Stone AI agent dependency graph
g = Graph(directed=True)
g.add_edge("user_query", "intent_classifier")
g.add_edge("intent_classifier", "agent_router")
g.add_edge("agent_router", "agent_1")
g.add_edge("agent_router", "agent_2")
g.add_edge("agent_1", "knowledge_base")
g.add_edge("agent_2", "knowledge_base")
g.add_edge("knowledge_base", "response_generator")
g.add_edge("response_generator", "user_response")
```

### Adjacency Matrix

```python
def to_adjacency_matrix(graph):
    """Convert graph to adjacency matrix (useful for linear algebra operations)."""
    nodes = sorted(graph.nodes())
    n = len(nodes)
    node_idx = {node: i for i, node in enumerate(nodes)}

    matrix = np.zeros((n, n))
    for u in nodes:
        for v, weight in graph.neighbors(u).items():
            matrix[node_idx[u]][node_idx[v]] = weight

    return matrix, nodes

matrix, node_names = to_adjacency_matrix(g)
# matrix[i][j] = weight of edge from node_names[i] to node_names[j]
```

---

## Path Finding

### Breadth-First Search (BFS)
Finds the shortest path in unweighted graphs. Explores all nodes at distance 1, then distance 2, etc.

```python
def bfs_shortest_path(graph, start, end):
    """Find shortest path (fewest edges) between start and end."""
    if start == end:
        return [start]

    visited = {start}
    queue = deque([(start, [start])])

    while queue:
        node, path = queue.popleft()

        for neighbor in graph.neighbors(node):
            if neighbor == end:
                return path + [neighbor]
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))

    return None  # No path exists

# Find path from user query to response
path = bfs_shortest_path(g, "user_query", "user_response")
print(f"Shortest path: {' → '.join(path)}")
```

### Dijkstra's Algorithm
Finds the shortest path in weighted graphs. Essential when edges have different costs.

```python
def dijkstra(graph, start, end=None):
    """
    Find shortest weighted path from start to all nodes (or just to end).
    Returns: {node: (distance, path)}
    """
    distances = {start: 0}
    paths = {start: [start]}
    pq = [(0, start)]  # (distance, node)
    visited = set()

    while pq:
        dist, node = heapq.heappop(pq)

        if node in visited:
            continue
        visited.add(node)

        if node == end:
            return {end: (distances[end], paths[end])}

        for neighbor, weight in graph.neighbors(node).items():
            new_dist = dist + weight

            if neighbor not in distances or new_dist < distances[neighbor]:
                distances[neighbor] = new_dist
                paths[neighbor] = paths[node] + [neighbor]
                heapq.heappush(pq, (new_dist, neighbor))

    return {node: (distances.get(node, float('inf')), paths.get(node, []))
            for node in graph.nodes()}

# Weighted example: API latencies
api_graph = Graph(directed=True)
api_graph.add_edge("gateway", "auth", weight=5)      # 5ms
api_graph.add_edge("gateway", "cache", weight=2)      # 2ms
api_graph.add_edge("auth", "database", weight=20)     # 20ms
api_graph.add_edge("cache", "database", weight=15)    # 15ms
api_graph.add_edge("database", "response", weight=3)  # 3ms
api_graph.add_edge("cache", "response", weight=1)     # 1ms (cache hit)

result = dijkstra(api_graph, "gateway", "response")
if "response" in result:
    dist, path = result["response"]
    print(f"Fastest path: {' → '.join(path)} ({dist}ms)")
```

---

## Centrality: Finding Important Nodes

### Degree Centrality
Most connected nodes.

```python
def degree_centrality(graph):
    """Normalized degree centrality: degree / (n-1)."""
    n = len(graph.nodes()) - 1
    if n <= 0:
        return {}
    return {node: graph.degree(node) / n for node in graph.nodes()}
```

### Betweenness Centrality
Nodes that appear on the most shortest paths. These are the "bridges" — if removed, many paths break.

```python
def betweenness_centrality(graph):
    """
    Fraction of all shortest paths that pass through each node.
    High betweenness = critical bottleneck.
    """
    centrality = {node: 0.0 for node in graph.nodes()}
    nodes = graph.nodes()

    for source in nodes:
        # BFS to find all shortest paths from source
        distances = {source: 0}
        num_paths = {source: 1}
        predecessors = {node: [] for node in nodes}
        queue = deque([source])
        order = []

        while queue:
            node = queue.popleft()
            order.append(node)

            for neighbor in graph.neighbors(node):
                # First visit
                if neighbor not in distances:
                    distances[neighbor] = distances[node] + 1
                    queue.append(neighbor)

                # Shortest path to neighbor through node
                if distances.get(neighbor) == distances[node] + 1:
                    num_paths[neighbor] = num_paths.get(neighbor, 0) + num_paths[node]
                    predecessors[neighbor].append(node)

        # Accumulate dependencies (reverse BFS order)
        dependency = {node: 0.0 for node in nodes}
        while order:
            node = order.pop()
            for pred in predecessors[node]:
                fraction = num_paths[pred] / num_paths.get(node, 1)
                dependency[pred] += fraction * (1 + dependency[node])
            if node != source:
                centrality[node] += dependency[node]

    # Normalize
    n = len(nodes)
    norm = 2.0 / ((n - 1) * (n - 2)) if n > 2 else 1.0
    return {node: score * norm for node, score in centrality.items()}
```

### Closeness Centrality
Nodes that are "close" to everything else (shortest average distance).

```python
def closeness_centrality(graph):
    """Inverse of average shortest path length from this node to all others."""
    result = {}
    nodes = graph.nodes()
    n = len(nodes)

    for node in nodes:
        distances = dijkstra(graph, node)
        reachable = [(d, p) for d, p in distances.values() if d < float('inf') and d > 0]

        if reachable:
            avg_dist = sum(d for d, _ in reachable) / len(reachable)
            result[node] = 1.0 / avg_dist if avg_dist > 0 else 0
        else:
            result[node] = 0

    return result
```

---

## PageRank

### The Algorithm
PageRank simulates a "random surfer" clicking links. A page is important if important pages link to it. Originally developed for Google Search, it's now used for entity ranking in knowledge graphs.

```python
def pagerank(graph, damping=0.85, max_iterations=100, tolerance=1e-6):
    """
    Calculate PageRank for a directed graph.
    damping: probability of following a link (vs random jump)
    """
    nodes = graph.nodes()
    n = len(nodes)
    rank = {node: 1.0 / n for node in nodes}

    for iteration in range(max_iterations):
        new_rank = {}

        for node in nodes:
            # Sum contributions from nodes that link TO this node
            incoming_sum = 0
            for other in nodes:
                if node in graph.neighbors(other):
                    out_degree = graph.degree(other)
                    if out_degree > 0:
                        incoming_sum += rank[other] / out_degree

            new_rank[node] = (1 - damping) / n + damping * incoming_sum

        # Check convergence
        delta = sum(abs(new_rank[n] - rank[n]) for n in nodes)
        rank = new_rank

        if delta < tolerance:
            break

    return rank

# Example: Knowledge graph entity ranking
kg = Graph(directed=True)
kg.add_edge("machine_learning", "neural_networks")
kg.add_edge("machine_learning", "linear_algebra")
kg.add_edge("neural_networks", "transformers")
kg.add_edge("neural_networks", "backpropagation")
kg.add_edge("transformers", "attention")
kg.add_edge("transformers", "embeddings")
kg.add_edge("attention", "machine_learning")  # Cycle back
kg.add_edge("embeddings", "vector_search")
kg.add_edge("vector_search", "rag")
kg.add_edge("rag", "embeddings")  # Another cycle
kg.add_edge("linear_algebra", "embeddings")

ranks = pagerank(kg)
sorted_ranks = sorted(ranks.items(), key=lambda x: x[1], reverse=True)
print("Entity importance ranking:")
for entity, rank in sorted_ranks:
    print(f"  {entity}: {rank:.4f}")
```

### PageRank for RAG: Ranking Retrieved Entities
When your knowledge graph returns 50 entities related to a query, use PageRank to determine which are most "important" globally — then combine with relevance score for a final ranking.

---

## Community Detection

### Connected Components

```python
def connected_components(graph):
    """Find groups of nodes that are all reachable from each other."""
    visited = set()
    components = []

    for node in graph.nodes():
        if node in visited:
            continue

        # BFS to find all nodes in this component
        component = []
        queue = deque([node])

        while queue:
            current = queue.popleft()
            if current in visited:
                continue
            visited.add(current)
            component.append(current)

            for neighbor in graph.neighbors(current):
                if neighbor not in visited:
                    queue.append(neighbor)

        components.append(component)

    return components
```

### Label Propagation (Simple Community Detection)

```python
def label_propagation(graph, max_iterations=100):
    """
    Simple community detection via label propagation.
    Each node adopts the most common label among its neighbors.
    """
    import random

    # Initialize: each node is its own community
    labels = {node: i for i, node in enumerate(graph.nodes())}

    for iteration in range(max_iterations):
        changed = False
        nodes = list(graph.nodes())
        random.shuffle(nodes)  # Random order prevents oscillation

        for node in nodes:
            neighbors = graph.neighbors(node)
            if not neighbors:
                continue

            # Count neighbor labels
            label_counts = defaultdict(int)
            for neighbor in neighbors:
                label_counts[labels[neighbor]] += 1

            # Adopt most common label
            most_common = max(label_counts, key=label_counts.get)
            if labels[node] != most_common:
                labels[node] = most_common
                changed = True

        if not changed:
            break

    # Group nodes by label
    communities = defaultdict(list)
    for node, label in labels.items():
        communities[label].append(node)

    return dict(communities)
```

---

## Graph Metrics for Knowledge Base Health

```python
def knowledge_graph_health(graph):
    """Calculate health metrics for a knowledge graph."""
    nodes = graph.nodes()
    n = len(nodes)
    edges = graph.edge_count()

    # Density: actual edges / possible edges
    possible = n * (n - 1) if graph.directed else n * (n - 1) / 2
    density = edges / possible if possible > 0 else 0

    # Average degree
    degrees = [graph.degree(node) for node in nodes]
    avg_degree = np.mean(degrees) if degrees else 0

    # Isolated nodes (no connections)
    isolated = sum(1 for d in degrees if d == 0)

    # Hub nodes (high degree)
    degree_threshold = avg_degree * 3
    hubs = [node for node in nodes if graph.degree(node) > degree_threshold]

    # Components
    components = connected_components(graph)

    return {
        'nodes': n,
        'edges': edges,
        'density': density,
        'avg_degree': avg_degree,
        'max_degree': max(degrees) if degrees else 0,
        'isolated_nodes': isolated,
        'hub_nodes': hubs,
        'num_components': len(components),
        'largest_component_size': max(len(c) for c in components) if components else 0,
        'fragmentation': 1 - (max(len(c) for c in components) / n) if n > 0 and components else 1,
    }

# Interpretation guide:
# density < 0.01 → Very sparse, may be missing relationships
# density > 0.5  → Very dense, may have too many weak relationships
# isolated_nodes > 0 → Orphaned entities that can never be retrieved via traversal
# fragmentation > 0.3 → Graph is broken into disconnected clusters
# hubs with degree >> average → Potential bottleneck entities
```

---

## Application: GraphRAG Entity Ranking

```python
def rank_entities_for_rag(
    graph,
    query_entities,
    max_hops=2,
    pagerank_weight=0.3,
    proximity_weight=0.7
):
    """
    Rank graph entities for RAG retrieval.
    Combines PageRank (global importance) with proximity to query entities.
    """
    ranks = pagerank(graph)

    # BFS from query entities, tracking distance
    proximity_scores = {}
    for start in query_entities:
        visited = {start: 0}
        queue = deque([(start, 0)])

        while queue:
            node, depth = queue.popleft()
            if depth >= max_hops:
                continue

            for neighbor in graph.neighbors(node):
                if neighbor not in visited:
                    visited[neighbor] = depth + 1
                    queue.append((neighbor, depth + 1))

        for node, depth in visited.items():
            # Closer = higher score (exponential decay)
            score = 1.0 / (2 ** depth)
            proximity_scores[node] = max(
                proximity_scores.get(node, 0), score
            )

    # Combine scores
    combined = {}
    for node in graph.nodes():
        pr = ranks.get(node, 0)
        prox = proximity_scores.get(node, 0)
        combined[node] = pagerank_weight * pr + proximity_weight * prox

    return sorted(combined.items(), key=lambda x: x[1], reverse=True)
```

---

## Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|---|---|---|
| Unbounded graph traversal | Explores entire graph for a local query | Cap traversal depth (2-3 hops) |
| Ignoring edge direction | "A depends on B" is different from "B depends on A" | Use directed graphs for knowledge |
| No edge weights | All relationships treated equally | Weight by confidence, recency, or frequency |
| Single giant component | One disconnected entity breaks retrieval for a whole domain | Monitor fragmentation, link orphans |
| Degree-only centrality | Misses bridging nodes | Use betweenness centrality for bottleneck detection |

---

## Key Takeaways

- Graphs model relationships that vectors cannot — multi-hop reasoning, structural dependencies, hierarchies.
- BFS finds shortest unweighted paths; Dijkstra finds shortest weighted paths.
- PageRank identifies globally important entities without explicit annotation.
- Betweenness centrality finds bottleneck nodes — entities whose removal would disconnect parts of the knowledge graph.
- Community detection groups related entities for cluster-level summarization in GraphRAG.
- Graph health metrics (density, fragmentation, isolated nodes) tell you if your knowledge graph needs maintenance.
