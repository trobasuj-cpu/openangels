"""
Venture Knowledge Graph & Multi-Hop Network Engine v0.1
OpenAngels Pipeline & Platform — Stage 8 Curriculum Implementation

Models the venture capital & angel ecosystem as a typed property graph:
- Triplets & Semantic Relationships:
    (Founder) -[:FOUNDED]-> (Company)
    (Company) -[:RAISED]-> (FundingRound)
    (FundingRound) -[:LED_BY]-> (Investor)
    (Investor) -[:INVESTED_IN]-> (Company)
    (Investor A) -[:CO_INVESTED_WITH]-> (Investor B)
    (Investor) -[:PARTNER_AT]-> (Firm)

- Multi-Hop Graph Traversal & Warm Intro Discovery:
    Founder A ➔ Company A ➔ Investor X ➔ Company B ➔ Founder B
    (Uncovers 2-hop & 3-hop warm introductions and syndicate networks)

- Graph-RAG (Retrieval-Augmented Generation) Context Export
- Neo4j Cypher Query Generator
"""

import os
import sys
import json
import base64
import urllib.request
from collections import deque, defaultdict
from typing import Dict, List, Tuple, Any, Optional, Set, Union
from datetime import datetime, timezone

# Force stdout to utf-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


# ============================================================================
# 1. GRAPH NODE & EDGE DEFINITIONS
# ============================================================================

class GraphNode:
    def __init__(self, node_id: str, node_type: str, label: str, properties: Optional[Dict[str, Any]] = None):
        self.id = str(node_id)
        self.type = node_type  # 'Founder', 'Company', 'FundingRound', 'Investor', 'Firm'
        self.label = label
        self.properties = properties or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type,
            "label": self.label,
            "properties": self.properties
        }


class GraphEdge:
    def __init__(self, source_id: str, target_id: str, relationship: str, properties: Optional[Dict[str, Any]] = None):
        self.source_id = str(source_id)
        self.target_id = str(target_id)
        self.relationship = relationship  # 'FOUNDED', 'RAISED', 'LED_BY', 'INVESTED_IN', 'CO_INVESTED_WITH', 'PARTNER_AT'
        self.properties = properties or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": self.source_id,
            "target": self.target_id,
            "relationship": self.relationship,
            "properties": self.properties
        }


# ============================================================================
# 2. VENTURE KNOWLEDGE GRAPH ENGINE
# ============================================================================

class VentureKnowledgeGraph:
    """
    High-performance Property Graph for Venture Capital & Angel Networks.
    Provides Multi-Hop traversal, BFS shortest path, syndicate clique discovery,
    and Graph-RAG context synthesis.
    """

    def __init__(self):
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: List[GraphEdge] = []
        # Adjacency maps for rapid traversal: node_id -> list of (neighbor_id, relationship, edge_props, direction)
        self.adj: Dict[str, List[Tuple[str, str, Dict[str, Any], str]]] = defaultdict(list)

    def add_node(self, node_id: str, node_type: str, label: str, properties: Optional[Dict[str, Any]] = None) -> GraphNode:
        str_id = str(node_id)
        if str_id not in self.nodes:
            self.nodes[str_id] = GraphNode(str_id, node_type, label, properties)
        else:
            if properties:
                self.nodes[str_id].properties.update(properties)
        return self.nodes[str_id]

    def add_edge(self, source_id: str, target_id: str, relationship: str, properties: Optional[Dict[str, Any]] = None) -> GraphEdge:
        src = str(source_id)
        tgt = str(target_id)
        edge = GraphEdge(src, tgt, relationship, properties)
        self.edges.append(edge)
        # Outgoing & Incoming adjacency
        self.adj[src].append((tgt, relationship, properties or {}, "OUT"))
        self.adj[tgt].append((src, relationship, properties or {}, "IN"))
        return edge

    def find_shortest_path(self, start_id: str, target_id: str, max_depth: int = 5) -> Optional[List[Dict[str, Any]]]:
        """
        Executes Breadth-First Search (BFS) to discover the shortest multi-hop relationship path
        between any two entities (e.g. Founder A -> Company A -> Investor X -> Company B -> Founder B).
        """
        start = str(start_id)
        target = str(target_id)

        if start not in self.nodes or target not in self.nodes:
            return None
        if start == target:
            return [{"node": self.nodes[start].to_dict(), "relationship": "SELF", "direction": "NONE"}]

        visited: Set[str] = {start}
        queue: deque = deque([[(start, None, None)]])

        while queue:
            path = queue.popleft()
            curr_node_id, _, _ = path[-1]

            if len(path) > max_depth + 1:
                continue

            if curr_node_id == target:
                # Reconstruct full path with node and edge details
                formatted_path = []
                for idx, (nid, rel, direction) in enumerate(path):
                    node_obj = self.nodes[nid].to_dict()
                    formatted_path.append({
                        "step": idx,
                        "node_id": nid,
                        "node_type": node_obj["type"],
                        "label": node_obj["label"],
                        "relationship": rel,
                        "direction": direction
                    })
                return formatted_path

            for neighbor_id, rel, props, direction in self.adj[curr_node_id]:
                if neighbor_id not in visited:
                    visited.add(neighbor_id)
                    new_path = list(path)
                    new_path.append((neighbor_id, rel, direction))
                    queue.append(new_path)

        return None

    def get_syndicate_partners(self, investor_id: str, top_n: int = 5) -> List[Dict[str, Any]]:
        """
        Finds the top co-investors who frequently co-invest with this investor across portfolio companies.
        """
        inv_id = str(investor_id)
        if inv_id not in self.nodes:
            return []

        # Find all portfolio companies backed by this investor
        backed_companies = set()
        for neighbor_id, rel, props, direction in self.adj[inv_id]:
            if rel == "INVESTED_IN" and direction == "OUT":
                backed_companies.add(neighbor_id)

        # Count co-investments with other investors
        co_investor_counts = defaultdict(lambda: {"count": 0, "shared_deals": []})
        for comp_id in backed_companies:
            comp_label = self.nodes[comp_id].label
            for other_id, rel, props, direction in self.adj[comp_id]:
                if rel == "INVESTED_IN" and direction == "IN" and other_id != inv_id:
                    co_investor_counts[other_id]["count"] += 1
                    co_investor_counts[other_id]["shared_deals"].append(comp_label)

        results = []
        for other_id, data in sorted(co_investor_counts.items(), key=lambda x: x[1]["count"], reverse=True)[:top_n]:
            other_node = self.nodes.get(other_id)
            if other_node:
                results.append({
                    "investor_id": other_id,
                    "name": other_node.label,
                    "shared_deals_count": data["count"],
                    "shared_deals": list(set(data["shared_deals"]))
                })

        return results

    def generate_graph_rag_context(self, investor_id: str) -> str:
        """
        Synthesizes graph triplets into rich natural-language context for AI cold email generation (Graph-RAG).
        """
        inv_id = str(investor_id)
        if inv_id not in self.nodes:
            return ""

        inv = self.nodes[inv_id]
        backed = []
        for neighbor_id, rel, props, direction in self.adj[inv_id]:
            if rel == "INVESTED_IN" and direction == "OUT":
                comp = self.nodes.get(neighbor_id)
                if comp:
                    backed.append(comp.label)

        syndicates = self.get_syndicate_partners(inv_id, top_n=3)

        lines = [f"Investor: {inv.label}"]
        if backed:
            lines.append(f"Backed Startups: {', '.join(backed[:6])}")
        if syndicates:
            synd_str = ", ".join(f"{s['name']} (co-invested in {', '.join(s['shared_deals'][:2])})" for s in syndicates)
            lines.append(f"Frequent Syndicate Partners: {synd_str}")

        return " | ".join(lines)

    def export_cypher_statements(self, limit: int = 50) -> List[str]:
        """
        Exports graph into Neo4j Cypher statements (CREATE / MERGE query format).
        """
        cypher = []
        for node in list(self.nodes.values())[:limit]:
            props_str = json.dumps(node.properties).replace('":', ':')
            cypher.append(f"MERGE (n:{node.type} {{id: '{node.id}', name: '{node.label}'}})")

        for edge in self.edges[:limit]:
            cypher.append(f"MATCH (a {{id: '{edge.source_id}'}}), (b {{id: '{edge.target_id}'}}) MERGE (a)-[:{edge.relationship}]->(b)")

        return cypher


# Global singleton graph instance
_DEFAULT_KNOWLEDGE_GRAPH = None

def get_venture_graph() -> VentureKnowledgeGraph:
    global _DEFAULT_KNOWLEDGE_GRAPH
    if _DEFAULT_KNOWLEDGE_GRAPH is None:
        _DEFAULT_KNOWLEDGE_GRAPH = VentureKnowledgeGraph()
    return _DEFAULT_KNOWLEDGE_GRAPH


# ============================================================================
# 3. CLI DEMO & VALIDATION SUITE (Stage 8 Exact Spec)
# ============================================================================

if __name__ == '__main__':
    print("=================================================================")
    print("=== OPENANGELS: VENTURE KNOWLEDGE GRAPH ENGINE (STAGE 8) ===")
    print("=================================================================\n")

    kg = VentureKnowledgeGraph()

    # 1. CURRICULUM TEST CASE 1: Full Triplet Venture Chain (Image 2)
    # Founder -> founded -> Company -> raised -> FundingRound -> led by -> Investor -> invested in -> Company B
    print("1. Practical Curriculum Test Case 1 (Venture Triplet Chain):")
    
    kg.add_node("founder_alex", "Founder", "Alex (Founder)")
    kg.add_node("comp_a", "Company", "Company A (AI Platform)", {"domain": "comp-a.com"})
    kg.add_node("round_seed", "FundingRound", "Seed Round ($3M)", {"amount": "$3M", "date": "2024-01"})
    kg.add_node("inv_x", "Investor", "Investor X (Angel)", {"location": "San Francisco, CA"})
    kg.add_node("comp_b", "Company", "Company B (Fintech)", {"domain": "comp-b.io"})
    kg.add_node("founder_b", "Founder", "Founder B (Fintech CEO)")

    # Triplet Connections
    kg.add_edge("founder_alex", "comp_a", "FOUNDED")
    kg.add_edge("comp_a", "round_seed", "RAISED")
    kg.add_edge("round_seed", "inv_x", "LED_BY")
    kg.add_edge("inv_x", "comp_a", "INVESTED_IN", {"stage": "Seed", "check": "$50k"})
    kg.add_edge("inv_x", "comp_b", "INVESTED_IN", {"stage": "Seed", "check": "$100k"})
    kg.add_edge("founder_b", "comp_b", "FOUNDED")

    print("   [+] Ingested Triplet Nodes and Edges successfully.")

    # 2. CURRICULUM TEST CASE 2: Multi-Hop Connection Discovery (Image 3)
    # Founder A ➔ Company A ➔ Investor X ➔ Company B ➔ Founder B
    print("\n2. Practical Curriculum Test Case 2 (Multi-Hop Warm Intro Discovery):")
    print("   Query: Find connection path between 'Alex (Founder)' and 'Founder B (Fintech CEO)'...")

    path = kg.find_shortest_path("founder_alex", "founder_b")
    assert path is not None
    print(f"   [FOUND {len(path)-1}-HOP PATH]:")
    for step in path:
        rel_info = f" ──[{step['relationship']}]──► " if step['relationship'] else ""
        print(f"   Step {step['step']}: {step['node_type']} '{step['label']}'{rel_info}")

    # Verify path steps match curriculum spec
    assert path[0]["node_id"] == "founder_alex"
    assert path[1]["node_id"] == "comp_a"
    assert path[2]["node_id"] == "inv_x"
    assert path[3]["node_id"] == "comp_b"
    assert path[4]["node_id"] == "founder_b"
    print("\n   [+] Test 2 Passed 100% Matching Curriculum Specification!\n")

    # 3. SYNDICATE NETWORK & GRAPH-RAG CONTEXT
    print("3. Syndicate Discovery & Graph-RAG Context Generation:")
    kg.add_node("inv_y", "Investor", "Investor Y (Naval)")
    kg.add_edge("inv_y", "comp_a", "INVESTED_IN")
    kg.add_edge("inv_y", "comp_b", "INVESTED_IN")

    syndicates = kg.get_syndicate_partners("inv_x")
    print(f"   - Investor X Syndicate Partners: {syndicates}")
    assert len(syndicates) >= 1
    assert syndicates[0]["name"] == "Investor Y (Naval)"
    assert syndicates[0]["shared_deals_count"] == 2

    rag_context = kg.generate_graph_rag_context("inv_x")
    print(f"   - Graph-RAG Context:\n     \"{rag_context}\"")

    # 4. NEO4J CYPHER QUERY EXPORT
    print("\n4. Neo4j Cypher Statement Generator:")
    cypher_statements = kg.export_cypher_statements(limit=6)
    for c in cypher_statements:
        print(f"   CYPHER: {c}")

    print("\n=================================================================")
    print("=== ALL STAGE 8 KNOWLEDGE GRAPH TESTS PASSED WITH 100% PRECISION ===")
    print("=================================================================")
