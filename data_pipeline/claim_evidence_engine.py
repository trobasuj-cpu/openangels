"""
OpenAngels Claim + Evidence Engine v1.0 (DAY 4 Architecture)
Implements the 7-layer Epistemic Provenance Chain:

  CLAIM
    ↓
  VALUE
    ↓
  SOURCE
    ↓
  EVIDENCE
    ↓
  DATE
    ↓
  CONFIDENCE
    ↓
  STATUS (VERIFIED | PROBABLE | CONFLICT | DISPUTED | UNVERIFIED)

Replaces legacy flat venture triples (Company → Funding → $5M) with a non-destructive,
evidence-backed claim graph capable of explicit conflict representation.
"""

import os
import sys
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any, Optional, Set, Union
from collections import Counter

# Force UTF-8 stdout on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Import Day 3 Source Trust Engine
try:
    from data_pipeline.source_trust_engine import (
        calculate_source_trust_score,
        classify_source_category,
        resolve_multi_source_consensus
    )
except ImportError:
    try:
        from source_trust_engine import (
            calculate_source_trust_score,
            classify_source_category,
            resolve_multi_source_consensus
        )
    except ImportError:
        calculate_source_trust_score = None
        classify_source_category = None
        resolve_multi_source_consensus = None


# ============================================================================
# 1. ATOMIC EVIDENCE RECORD
# ============================================================================

class EvidenceRecord:
    """
    Atomic proof unit supporting or contesting a factual claim.
    """
    def __init__(
        self,
        source_name: str,
        asserted_value: Any,
        evidence_text: str,
        source_url: Optional[str] = None,
        source_tier: Optional[str] = None,
        source_subtype: Optional[str] = None,
        published_at: Optional[str] = None,
        collected_at: Optional[str] = None,
        trust_score: Optional[float] = None,
        is_supporting: bool = True,
        evidence_id: Optional[str] = None
    ):
        self.evidence_id = evidence_id or f"EVD-{uuid.uuid4().hex[:8]}"
        self.source_name = source_name
        self.source_url = source_url or ""
        self.asserted_value = asserted_value
        self.evidence_text = evidence_text
        self.published_at = published_at or datetime.now(timezone.utc).isoformat()
        self.collected_at = collected_at or datetime.now(timezone.utc).isoformat()
        self.is_supporting = is_supporting

        # Classify Tier and Subtype if not provided
        if (not source_tier or not source_subtype) and classify_source_category:
            detected_tier, detected_sub = classify_source_category(self.source_url, self.source_name)
            self.source_tier = source_tier or detected_tier
            self.source_subtype = source_subtype or detected_sub
        else:
            self.source_tier = source_tier or "tier_2"
            self.source_subtype = source_subtype or "tier_2_major_media"

        # Calculate trust score if not explicitly passed
        if trust_score is not None:
            self.trust_score = round(float(trust_score), 3)
        elif calculate_source_trust_score:
            res = calculate_source_trust_score(
                source_url=self.source_url,
                claim_type="round_amount_valuation",  # Default context fallback
                source_name=self.source_name
            )
            self.trust_score = res.get('trust_score', 0.80)
        else:
            tier_defaults = {'tier_1': 1.00, 'tier_2': 0.88, 'tier_3': 0.74, 'tier_4': 0.45}
            self.trust_score = tier_defaults.get(self.source_tier, 0.75)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "evidence_id": self.evidence_id,
            "source_name": self.source_name,
            "source_url": self.source_url,
            "source_tier": self.source_tier,
            "source_subtype": self.source_subtype,
            "asserted_value": self.asserted_value,
            "evidence_text": self.evidence_text,
            "published_at": self.published_at,
            "collected_at": self.collected_at,
            "trust_score": self.trust_score,
            "is_supporting": self.is_supporting
        }


# ============================================================================
# 2. EPISTEMIC CLAIM RECORD (7-STEP PROVENANCE CHAIN)
# ============================================================================

class ClaimRecord:
    """
    Represents a verified or disputed claim in the 7-step chain:
    CLAIM ↓ VALUE ↓ SOURCE ↓ EVIDENCE ↓ DATE ↓ CONFIDENCE ↓ STATUS
    """
    def __init__(
        self,
        subject_id: str,
        subject_name: str,
        claim_type: str,
        statement: str,
        canonical_value: Any,
        subject_type: str = "company",
        claim_id: Optional[str] = None,
        evidence: Optional[List[EvidenceRecord]] = None,
        status: str = "PROBABLE",
        confidence: float = 0.85,
        consensus_ratio: str = "1/1",
        conflicts: Optional[List[Dict[str, Any]]] = None,
        first_observed_at: Optional[str] = None,
        last_verified_at: Optional[str] = None
    ):
        now_iso = datetime.now(timezone.utc).isoformat()
        self.claim_id = claim_id or f"CLM-{uuid.uuid4().hex[:8]}"
        self.subject_id = subject_id
        self.subject_name = subject_name
        self.subject_type = subject_type
        self.claim_type = claim_type
        self.statement = statement
        self.canonical_value = canonical_value
        self.evidence: List[EvidenceRecord] = evidence or []
        self.status = status
        self.confidence = confidence
        self.consensus_ratio = consensus_ratio
        self.conflicts = conflicts or []
        self.first_observed_at = first_observed_at or now_iso
        self.last_verified_at = last_verified_at or now_iso

    def to_dict(self) -> Dict[str, Any]:
        return {
            "claim_id": self.claim_id,
            "subject_id": self.subject_id,
            "subject_name": self.subject_name,
            "subject_type": self.subject_type,
            "claim_type": self.claim_type,
            "statement": self.statement,
            "canonical_value": self.canonical_value,
            "status": self.status,
            "confidence": round(self.confidence, 2),
            "consensus_ratio": self.consensus_ratio,
            "evidence_count": len(self.evidence),
            "conflict_count": len(self.conflicts),
            "first_observed_at": self.first_observed_at,
            "last_verified_at": self.last_verified_at,
            "evidence": [e.to_dict() for e in self.evidence],
            "conflicts": self.conflicts
        }

    def format_epistemic_chain(self) -> str:
        """
        Formats the claim into the human-readable 7-layer visual chain required by Day 4:
        CLAIM ↓ VALUE ↓ SOURCE ↓ EVIDENCE ↓ DATE ↓ CONFIDENCE ↓ STATUS
        """
        sources_str = ", ".join([f"{e.source_name} ({e.source_tier.upper()})" for e in self.evidence])
        ev_sample = self.evidence[0].evidence_text if self.evidence else "No excerpt"
        if len(ev_sample) > 90:
            ev_sample = ev_sample[:87] + "..."
        date_str = self.last_verified_at[:10] if self.last_verified_at else "Unknown"

        status_marker = "[VERIFIED]" if self.status == "VERIFIED" else f"[{self.status}]"

        lines = [
            f"CLAIM:      \"{self.statement}\"",
            f"  ↓",
            f"VALUE:      {self.canonical_value}",
            f"  ↓",
            f"SOURCE:     {sources_str}",
            f"  ↓",
            f"EVIDENCE:   \"{ev_sample}\"",
            f"  ↓",
            f"DATE:       {date_str} (Observed: {self.first_observed_at[:10]})",
            f"  ↓",
            f"CONFIDENCE: {self.confidence * 100:.1f}% (Consensus: {self.consensus_ratio})",
            f"  ↓",
            f"STATUS:     {status_marker}"
        ]
        if self.conflicts:
            lines.append("  [!] CONFLICT DETAILS:")
            for c in self.conflicts:
                lines.append(f"      - {c.get('source_name')}: claimed '{c.get('asserted_value')}' (vs '{self.canonical_value}')")
        return "\n".join(lines)


# ============================================================================
# 3. CLAIM + EVIDENCE ENGINE
# ============================================================================

class ClaimEvidenceEngine:
    """
    Manages structured claims and multi-source evidence collections.
    Provides conflict detection, epistemic trust resolution, and flat-triple conversion.
    """
    def __init__(self):
        self._claims_registry: Dict[str, ClaimRecord] = {}

    def _make_claim_key(self, subject_id: str, claim_type: str) -> str:
        return f"{subject_id.strip().lower()}:{claim_type.strip().lower()}"

    def record_claim_assertion(
        self,
        subject_id: str,
        subject_name: str,
        claim_type: str,
        statement: str,
        asserted_value: Any,
        source_name: str,
        evidence_text: str,
        source_url: Optional[str] = None,
        published_at: Optional[str] = None,
        source_tier: Optional[str] = None,
        subject_type: str = "company"
    ) -> ClaimRecord:
        """
        Ingests an observation with evidence and attaches it to the appropriate ClaimRecord.
        Performs conflict detection and recomputes the 7-step chain status.
        """
        claim_key = self._make_claim_key(subject_id, claim_type)
        now_iso = datetime.now(timezone.utc).isoformat()

        # Build atomic evidence
        evidence_item = EvidenceRecord(
            source_name=source_name,
            asserted_value=asserted_value,
            evidence_text=evidence_text,
            source_url=source_url,
            source_tier=source_tier,
            published_at=published_at or now_iso,
            collected_at=now_iso
        )

        if claim_key not in self._claims_registry:
            # First observation of claim
            claim = ClaimRecord(
                subject_id=subject_id,
                subject_name=subject_name,
                subject_type=subject_type,
                claim_type=claim_type,
                statement=statement,
                canonical_value=asserted_value,
                evidence=[evidence_item],
                status="PROBABLE",
                confidence=0.85,
                consensus_ratio="1/1",
                conflicts=[],
                first_observed_at=now_iso,
                last_verified_at=now_iso
            )
            self._claims_registry[claim_key] = claim
            return claim

        # Multi-evidence accumulation
        claim = self._claims_registry[claim_key]
        claim.evidence.append(evidence_item)
        claim.last_verified_at = now_iso

        # Re-evaluate multi-source consensus and conflict detection
        self._recompute_claim_epistemology(claim)
        return claim

    def from_flat_triple(
        self,
        subject_name: str,
        predicate: str,
        object_value: Any,
        source_name: str = "Venture Press & Filings",
        source_url: Optional[str] = None,
        evidence_text: Optional[str] = None,
        published_at: Optional[str] = None,
        subject_type: str = "company"
    ) -> ClaimRecord:
        """
        Converts a legacy flat triple (e.g. 'Company X' -> 'Funding' -> '$5M')
        into the complete 7-step Claim + Evidence structure.
        """
        subject_id = f"subj_{subject_name.strip().lower().replace(' ', '_')}"
        norm_pred = predicate.strip().lower().replace(' ', '_')

        if not evidence_text:
            evidence_text = f"Verified declaration: {subject_name} {predicate} is {object_value}."

        statement = f"{subject_name} {predicate.replace('_', ' ')}: {object_value}"

        return self.record_claim_assertion(
            subject_id=subject_id,
            subject_name=subject_name,
            claim_type=norm_pred,
            statement=statement,
            asserted_value=object_value,
            source_name=source_name,
            evidence_text=evidence_text,
            source_url=source_url,
            published_at=published_at,
            subject_type=subject_type
        )

    def _recompute_claim_epistemology(self, claim: ClaimRecord):
        """
        Evaluates agreement, detects contradictions, assigns status (VERIFIED vs CONFLICT),
        and computes confidence using the Day 3 Epistemic Trust Consensus.
        """
        total_evidence = len(claim.evidence)
        if total_evidence == 0:
            return

        # 1. Cluster evidence by normalized asserted values
        clusters: Dict[str, List[EvidenceRecord]] = {}
        for ev in claim.evidence:
            val_norm = str(ev.asserted_value).strip().lower()
            clusters.setdefault(val_norm, []).append(ev)

        # 2. Use Day 3 Multi-Source Consensus if available
        if resolve_multi_source_consensus:
            assertions_input = [
                {
                    "source_name": ev.source_name,
                    "source_url": ev.source_url,
                    "value": ev.asserted_value,
                    "is_direct_smtp": "smtp" in ev.source_name.lower()
                }
                for ev in claim.evidence
            ]
            
            consensus_result = resolve_multi_source_consensus(
                claim_type=claim.claim_type,
                assertions=assertions_input
            )

            canonical_val = consensus_result.get("canonical_value")
            if canonical_val is not None:
                claim.canonical_value = canonical_val

            norm_winner = str(claim.canonical_value).strip().lower()
            winner_evidence_count = len(clusters.get(norm_winner, []))
            claim.consensus_ratio = f"{winner_evidence_count}/{total_evidence}"

            # Tag each evidence record as supporting or dissenting
            for ev in claim.evidence:
                ev.is_supporting = (str(ev.asserted_value).strip().lower() == norm_winner)

            # Detect Conflicts
            conflicts = []
            if len(clusters) > 1:
                for val_norm, ev_list in clusters.items():
                    if val_norm != norm_winner:
                        for ev in ev_list:
                            conflicts.append({
                                "source_name": ev.source_name,
                                "source_url": ev.source_url,
                                "source_tier": ev.source_tier,
                                "asserted_value": ev.asserted_value,
                                "canonical_value": claim.canonical_value,
                                "evidence_snippet": ev.evidence_text,
                                "published_at": ev.published_at,
                                "trust_score": ev.trust_score
                            })
            claim.conflicts = conflicts

            # Determine Status & Confidence
            # Rule for CONFLICT: Multiple distinct values from credible sources (tier 1..3)
            # or consensus ratio is less than 65% with competing claims
            ratio = winner_evidence_count / total_evidence

            if len(clusters) > 1 and ratio <= 0.65:
                # Strong conflict!
                claim.status = "CONFLICT"
                claim.confidence = round(max(0.50, min(0.70, consensus_result.get("confidence", 0.65))), 2)
            elif total_evidence >= 3 and ratio >= 0.75:
                claim.status = "VERIFIED"
                claim.confidence = round(min(0.99, max(0.90, consensus_result.get("confidence", 0.94))), 2)
            elif total_evidence >= 2 and ratio == 1.0:
                claim.status = "VERIFIED"
                claim.confidence = 0.96
            elif len(clusters) > 1:
                # Disagreement exists but winner has significant weight advantage
                claim.status = "PROBABLE"
                claim.confidence = 0.80
            else:
                claim.status = "PROBABLE"
                claim.confidence = 0.88

        else:
            # Fallback heuristic if source trust engine is decoupled
            val_counts = Counter({k: len(v) for k, v in clusters.items()})
            winner_norm, winner_count = val_counts.most_common(1)[0]
            claim.canonical_value = clusters[winner_norm][0].asserted_value
            claim.consensus_ratio = f"{winner_count}/{total_evidence}"

            for ev in claim.evidence:
                ev.is_supporting = (str(ev.asserted_value).strip().lower() == winner_norm)

            conflicts = []
            if len(clusters) > 1:
                for k, v in clusters.items():
                    if k != winner_norm:
                        for ev in v:
                            conflicts.append({
                                "source_name": ev.source_name,
                                "asserted_value": ev.asserted_value,
                                "canonical_value": claim.canonical_value
                            })
            claim.conflicts = conflicts

            ratio = winner_count / total_evidence
            if len(clusters) > 1 and ratio <= 0.65:
                claim.status = "CONFLICT"
                claim.confidence = 0.65
            elif total_evidence >= 2 and ratio >= 0.75:
                claim.status = "VERIFIED"
                claim.confidence = 0.94
            else:
                claim.status = "PROBABLE"
                claim.confidence = 0.85

    def get_claim(self, subject_id: str, claim_type: str) -> Optional[ClaimRecord]:
        return self._claims_registry.get(self._make_claim_key(subject_id, claim_type))

    def export_summary(self) -> Dict[str, Any]:
        all_claims = [c.to_dict() for c in self._claims_registry.values()]
        verified = sum(1 for c in all_claims if c['status'] == 'VERIFIED')
        conflicts = sum(1 for c in all_claims if c['status'] == 'CONFLICT')
        return {
            "total_claims": len(all_claims),
            "verified_claims": verified,
            "conflict_claims": conflicts,
            "claims": all_claims
        }


# ============================================================================
# 4. SINGLETON & CLI VALIDATION SUITE (DAY 4 SPEC)
# ============================================================================

_GLOBAL_CLAIM_ENGINE = None

def get_claim_engine() -> ClaimEvidenceEngine:
    global _GLOBAL_CLAIM_ENGINE
    if _GLOBAL_CLAIM_ENGINE is None:
        _GLOBAL_CLAIM_ENGINE = ClaimEvidenceEngine()
    return _GLOBAL_CLAIM_ENGINE


if __name__ == '__main__':
    print("=======================================================================")
    print("=== OPENANGELS: DAY 4 — CLAIM + EVIDENCE SYSTEM ARCHITECTURE ===")
    print("=======================================================================\n")

    engine = ClaimEvidenceEngine()

    # ------------------------------------------------------------------------
    # SCENARIO 1: FULL VERIFIED PROVENANCE CHAIN (3 AGREEING SOURCES)
    # ------------------------------------------------------------------------
    print("--- SCENARIO 1: 'Company X raised $5M' (Status: VERIFIED) ---")
    print("Ingesting 3 agreeing sources (Company Website, Investor Site, TechCrunch)...")

    # Source A: Company PR
    engine.record_claim_assertion(
        subject_id="comp_x",
        subject_name="Company X",
        claim_type="funding_round",
        statement="Company X raised $5M in Series A",
        asserted_value="$5M",
        source_name="Company website",
        source_url="https://companyx.com/press/series-a",
        evidence_text="Company X announces $5,000,000 Series A funding led by OpenAngels to scale AI agents.",
        published_at="2024-02-10T10:00:00Z",
        source_tier="tier_1"
    )

    # Source B: Investor Portfolio Site
    engine.record_claim_assertion(
        subject_id="comp_x",
        subject_name="Company X",
        claim_type="funding_round",
        statement="Company X raised $5M in Series A",
        asserted_value="$5M",
        source_name="Investor website",
        source_url="https://openangels.xyz/portfolio/company-x",
        evidence_text="Portfolio Investment: Company X — $5M Series A lead investment.",
        published_at="2024-02-10T11:30:00Z",
        source_tier="tier_1"
    )

    # Source C: Major Press (TechCrunch)
    c1 = engine.record_claim_assertion(
        subject_id="comp_x",
        subject_name="Company X",
        claim_type="funding_round",
        statement="Company X raised $5M in Series A",
        asserted_value="$5M",
        source_name="TechCrunch",
        source_url="https://techcrunch.com/2024/02/company-x-raises-5m",
        evidence_text="Enterprise AI startup Company X closes $5M in Series A financing.",
        published_at="2024-02-10T14:00:00Z",
        source_tier="tier_2"
    )

    print("\n[Visual 7-Layer Epistemic Output]:")
    print(c1.format_epistemic_chain())

    assert c1.status == "VERIFIED", f"Expected VERIFIED, got {c1.status}"
    assert c1.canonical_value == "$5M"
    assert c1.consensus_ratio == "3/3"
    assert c1.confidence >= 0.90
    assert len(c1.conflicts) == 0
    print("\n[+] Scenario 1 Verified Successfully: All 3 sources confirm $5M with 0 conflicts.\n")

    # ------------------------------------------------------------------------
    # SCENARIO 2: CONTRADICTORY EVIDENCE CHAIN (Status: CONFLICT)
    # ------------------------------------------------------------------------
    print("-----------------------------------------------------------------------")
    print("--- SCENARIO 2: 'Stripe Series I Round Size' (Status: CONFLICT) ---")
    print("Ingesting 2 conflicting reports ($6.5B vs $6.0B)...")

    # Source A: Wall Street Journal ($6.5B)
    engine.record_claim_assertion(
        subject_id="comp_stripe",
        subject_name="Stripe",
        claim_type="funding_round",
        statement="Stripe raised Series I round",
        asserted_value="$6.5B",
        source_name="Wall Street Journal",
        source_url="https://wsj.com/articles/stripe-funding-round-valuation",
        evidence_text="Stripe finalizes terms to raise $6.5 billion at a $50 billion valuation.",
        published_at="2023-03-15T09:00:00Z",
        source_tier="tier_2"
    )

    # Source B: FinTech Report ($6.0B)
    c2 = engine.record_claim_assertion(
        subject_id="comp_stripe",
        subject_name="Stripe",
        claim_type="funding_round",
        statement="Stripe raised Series I round",
        asserted_value="$6.0B",
        source_name="FinTech Insider",
        source_url="https://fintechinsider.com/stripe-secures-6b",
        evidence_text="Payments giant Stripe closes financing round at $6.0 billion total capital.",
        published_at="2023-03-16T12:00:00Z",
        source_tier="tier_3"
    )

    print("\n[Visual 7-Layer Epistemic Output]:")
    print(c2.format_epistemic_chain())

    assert c2.status == "CONFLICT", f"Expected CONFLICT, got {c2.status}"
    assert len(c2.conflicts) == 1
    assert c2.conflicts[0]['asserted_value'] == "$6.0B"
    print("\n[+] Scenario 2 Verified Successfully: Conflict detected between $6.5B and $6.0B.")
    print("    System preserved both assertions without data destruction!\n")

    # ------------------------------------------------------------------------
    # SCENARIO 3: LOSSLESS CONVERSION FROM LEGACY FLAT TRIPLE
    # ------------------------------------------------------------------------
    print("-----------------------------------------------------------------------")
    print("--- SCENARIO 3: Lossless Conversion from Legacy Flat Triples ---")
    print("Converting 'Anthropic' -> 'Investment' -> '$4B' into 7-Step Chain...")

    c3 = engine.from_flat_triple(
        subject_name="Anthropic",
        predicate="funding_round",
        object_value="$4B",
        source_name="Amazon SEC 10-Q Filing",
        source_url="https://sec.gov/edgar/data/amazon-10q",
        evidence_text="Amazon closed an aggregate $4.0 billion convertible investment in Anthropic PBC.",
        published_at="2024-03-27T16:00:00Z"
    )

    print("\n[Converted Flat Triple Output]:")
    print(c3.format_epistemic_chain())
    assert c3.canonical_value == "$4B"
    assert c3.evidence[0].source_tier == "tier_1"
    print("\n[+] Scenario 3 Verified Successfully: Flat triple promoted to full Claim Object.")

    print("\n=======================================================================")
    print("=== ALL DAY 4 CLAIM + EVIDENCE SUITE TESTS PASSED WITH 100% PRECISION ===")
    print("=======================================================================")
