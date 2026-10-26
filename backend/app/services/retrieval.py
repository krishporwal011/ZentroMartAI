"""Knowledge Base ingestion, BM25 indexing, and policy precedence retrieval."""
from pathlib import Path
from typing import Dict, List, Optional, Any, Set, Tuple
import re
import math
from collections import Counter
import yaml

from app.config import settings

DOC_TYPE_RANKS = {
    "policy": 1,
    "agent_guide": 2,
    "help": 3,
    "faq": 4,
    "marketing": 5,
    "meta": 6,
}

# Synonyms and cross-language stems for English, Hindi (Devanagari) and Hinglish
TERM_MAP = {
    # Returns
    "return": ["return", "returns", "wapas", "vaapas", "lauta", "lautane", "वापस", "लौटाने", "लौटा"],
    "window": ["window", "din", "days", "samay", "time", "kitne din", "दिन", "समय"],
    "pickup": ["pickup", "pick up", "reverse pickup", "collection", "lene", "पिकअप", "लेने"],
    # Refunds
    "refund": ["refund", "refunds", "paise", "money", "credit", "रिफ़ंड", "रिफंड", "पैसे", "वापसी"],
    "timeline": ["timeline", "duration", "kab tak", "kab milega", "time", "घंटे", "दिन", "कब"],
    # Delivery
    "delivery": ["delivery", "shipping", "shipped", "courier", "parcel", "aaya", "pahuncha", "डिलीवरी", "पार्सल", "आया", "पहुंचा"],
    "express": ["express", "fast", "speed", "late", "तेज़", "एक्सप्रेस", "देरी"],
    # Cancellations
    "cancel": ["cancel", "cancellation", "cancelling", "rokna", "radd", "कैंसिल", "रद्द"],
    # Damaged / wrong / missing
    "damage": ["damage", "damaged", "broken", "kharab", "toota", "sparks", "battery", "खराब", "टूटा", "नुकसान"],
    "wrong": ["wrong", "galat", "incorrect", "different", "गलत", "भिन्न"],
    "missing": ["missing", "gayab", "not received", "empty", "गायब", "नहीं मिला"],
    # Warranty & Assured
    "warranty": ["warranty", "guarantee", "assured", "brand warranty", "वारंटी", "गारंटी", "अश्योर्ड"],
    # Plus membership
    "plus": ["plus", "membership", "subscription", "member", "प्लस", "मेंबरशिप", "सदस्यता"],
    # Coupons
    "coupon": ["coupon", "discount", "code", "offer", "voucher", "कूपन", "डिस्काउंट", "छूट", "ऑफ़र"],
    # Escalation
    "human": ["human", "agent", "person", "representative", "insan", "colleague", "support", "इंसान", "प्रतिनिधि", "सहायक", "सहयोगी"],
}


class SectionChunk:
    def __init__(
        self,
        doc_id: str,
        doc_title: str,
        doc_type: str,
        audience: str,
        language: str,
        version: str,
        effective_from: str,
        status: str,
        supersedes: Optional[str],
        superseded_by: Optional[str],
        section_id: str,
        section_title: str,
        content: str,
        source_file: str,
    ):
        self.doc_id = doc_id
        self.doc_title = doc_title
        self.doc_type = doc_type
        self.audience = audience
        self.language = language
        self.version = version
        self.effective_from = effective_from
        self.status = status
        self.supersedes = supersedes
        self.superseded_by = superseded_by
        self.section_id = section_id
        self.section_title = section_title
        self.content = content
        self.source_file = source_file
        
        # Search tokens
        full_text = f"{doc_title} {section_id} {section_title} {content}".lower()
        self.tokens = re.findall(r"[\w\u0900-\u097F\-]+", full_text)
        self.token_counts = Counter(self.tokens)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "doc_id": self.doc_id,
            "doc_title": self.doc_title,
            "doc_type": self.doc_type,
            "audience": self.audience,
            "language": self.language,
            "version": self.version,
            "effective_from": self.effective_from,
            "status": self.status,
            "supersedes": self.supersedes,
            "superseded_by": self.superseded_by,
            "section_id": self.section_id,
            "section_title": self.section_title,
            "content": self.content,
            "source_file": self.source_file,
        }


class KnowledgeBaseRetriever:
    def __init__(self, kb_dir: Optional[Path] = None):
        self.kb_dir = kb_dir or (settings.DATASET_DIR / "kb")
        self.sections: List[SectionChunk] = []
        self.section_by_id: Dict[str, SectionChunk] = {}
        self.doc_freq: Dict[str, int] = Counter()
        self.avg_doc_len: float = 0.0
        self.total_docs: int = 0
        self.reload()

    def reload(self):
        """Parse all markdown files in kb/ and index semantic sections."""
        self.sections = []
        self.section_by_id = {}
        self.doc_freq = Counter()
        
        if not self.kb_dir.exists():
            return

        for md_path in self.kb_dir.glob("*.md"):
            self._ingest_file(md_path)

        self.total_docs = len(self.sections)
        if self.total_docs > 0:
            total_tokens = sum(len(s.tokens) for s in self.sections)
            self.avg_doc_len = total_tokens / self.total_docs
            
            for section in self.sections:
                for token in set(section.tokens):
                    self.doc_freq[token] += 1

    def _ingest_file(self, file_path: Path):
        text = file_path.read_text(encoding="utf-8")
        meta = {}
        body = text
        
        # Parse YAML frontmatter
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                try:
                    meta = yaml.safe_load(parts[1]) or {}
                    body = parts[2]
                except Exception:
                    pass

        doc_id = str(meta.get("doc_id", file_path.stem))
        doc_title = str(meta.get("title", file_path.stem))
        doc_type = str(meta.get("doc_type", "help"))
        audience = str(meta.get("audience", "customer"))
        language = str(meta.get("language", "en"))
        version = str(meta.get("version", "1.0"))
        effective_from = str(meta.get("effective_from", "2026-01-01"))
        status = str(meta.get("status", "current"))
        supersedes = meta.get("supersedes")
        superseded_by = meta.get("superseded_by")

        # Split into sections based on ## [SECTION-ID] Title
        pattern = r"^##\s*\[([^\]]+)\]\s*(.*)$"
        lines = body.splitlines()
        current_sec_id = None
        current_sec_title = ""
        current_sec_lines = []

        for line in lines:
            match = re.match(pattern, line.strip())
            if match:
                if current_sec_id:
                    chunk = SectionChunk(
                        doc_id=doc_id,
                        doc_title=doc_title,
                        doc_type=doc_type,
                        audience=audience,
                        language=language,
                        version=version,
                        effective_from=effective_from,
                        status=status,
                        supersedes=supersedes,
                        superseded_by=superseded_by,
                        section_id=current_sec_id,
                        section_title=current_sec_title,
                        content="\n".join(current_sec_lines).strip(),
                        source_file=file_path.name,
                    )
                    self.sections.append(chunk)
                    self.section_by_id[current_sec_id] = chunk

                current_sec_id = match.group(1).strip()
                current_sec_title = match.group(2).strip()
                current_sec_lines = []
            else:
                if current_sec_id is not None:
                    current_sec_lines.append(line)

        # Append last section
        if current_sec_id:
            chunk = SectionChunk(
                doc_id=doc_id,
                doc_title=doc_title,
                doc_type=doc_type,
                audience=audience,
                language=language,
                version=version,
                effective_from=effective_from,
                status=status,
                supersedes=supersedes,
                superseded_by=superseded_by,
                section_id=current_sec_id,
                section_title=current_sec_title,
                content="\n".join(current_sec_lines).strip(),
                source_file=file_path.name,
            )
            self.sections.append(chunk)
            self.section_by_id[current_sec_id] = chunk

    def _expand_query(self, query: str) -> List[str]:
        """Normalize and expand query tokens with synonym mapping."""
        q_tokens = re.findall(r"[\w\u0900-\u097F\-]+", query.lower())
        expanded = list(q_tokens)
        
        for q_token in q_tokens:
            for canonical, syns in TERM_MAP.items():
                if q_token in syns:
                    expanded.extend(syns[:4])
        return list(set(expanded))

    def get_section(self, section_id: str) -> Optional[SectionChunk]:
        return self.section_by_id.get(section_id)

    def search(
        self,
        query: str,
        top_k: int = 5,
        filter_status: Optional[str] = None,
        disallow_hard_negatives: Optional[List[str]] = None,
    ) -> List[Tuple[SectionChunk, float]]:
        """BM25 search with policy precedence weighting and hard negative suppression."""
        if not self.sections:
            return []

        q_tokens = self._expand_query(query)
        scores: List[Tuple[SectionChunk, float]] = []
        k1 = 1.5
        b = 0.75

        # Section ID direct mention in query bonus
        explicit_sec_ids = re.findall(r"\b([A-Z]{2,4}-?\d+(?:\.\d+)?)\b", query.upper())

        for section in self.sections:
            if filter_status and section.status != filter_status:
                continue

            # Hard negative suppression
            if disallow_hard_negatives and section.section_id in disallow_hard_negatives:
                continue

            score = 0.0
            doc_len = len(section.tokens)
            
            for token in q_tokens:
                tf = section.token_counts.get(token, 0)
                if tf == 0:
                    continue
                df = self.doc_freq.get(token, 0)
                idf = math.log((self.total_docs - df + 0.5) / (df + 0.5) + 1.0)
                denom = tf + k1 * (1.0 - b + b * (doc_len / (self.avg_doc_len or 1.0)))
                score += idf * (tf * (k1 + 1.0)) / denom

            # Section ID boost
            if section.section_id.upper() in explicit_sec_ids:
                score += 25.0

            # Policy Precedence Weighting:
            # Current policy > Agent Guide > Help > FAQ > Marketing
            # Superseded policy receives a heavy discount unless explicitly queried
            rank = DOC_TYPE_RANKS.get(section.doc_type, 4)
            if section.status == "superseded":
                score *= 0.35  # heavily discount superseded versions
            else:
                # Rank boost: Policy gets 1.4x, Guide 1.25x, Help 1.1x, FAQ 0.9x, Marketing 0.7x
                multipliers = {1: 1.4, 2: 1.25, 3: 1.1, 4: 0.9, 5: 0.7, 6: 1.0}
                score *= multipliers.get(rank, 1.0)

            if score > 0:
                scores.append((section, round(score, 4)))

        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]


# Global retriever instance
kb_retriever = KnowledgeBaseRetriever()
