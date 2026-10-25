"""
indian_module.py
-----------------
Indian statutory-corpus compliance branch for BEACON.
Evaluates meeting decisions against Indian statutory law:
- Companies Act, 2013 (Board powers, related-party transactions, loans to directors, CSR)
- SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015
- SEBI (Prohibition of Insider Trading) Regulations
- Indian Employment & Standing Orders laws
"""

import re
from typing import List, Dict, Any

INDIAN_STATUTES = [
    {
        "id": "CA_185",
        "act": "Companies Act, 2013",
        "section": "Section 185",
        "title": "Loans and Advances to Directors",
        "rule": "No company shall advance any loan, guarantee or security to any of its directors or entities in which the director is interested without prior special resolution and strict statutory compliance.",
        "patterns": [r"\bloan\s+to\s+(?:director|ceo|cfo|md)\b", r"\badvance\s+to\s+(?:director|founder)\b", r"\bguarantee\s+for\s+director\b"]
    },
    {
        "id": "CA_188",
        "act": "Companies Act, 2013",
        "section": "Section 188 / SEBI LODR Reg 23",
        "title": "Related Party Transactions",
        "rule": "Contracts with related parties or director-owned entities require prior approval of the Audit Committee and Board. Material transactions require shareholder approval.",
        "patterns": [r"\brelated\s+party\b", r"\bcontract\s+with\s+(?:director|founder|promoter)['s\s]+(?:firm|entity|relative)\b", r"\baward.*to.*family\b"]
    },
    {
        "id": "CA_180",
        "act": "Companies Act, 2013",
        "section": "Section 180(1)(c)",
        "title": "Borrowing Limits of the Board",
        "rule": "The Board of Directors cannot borrow money exceeding the aggregate of its paid-up share capital, free reserves and securities premium without prior approval of shareholders by special resolution.",
        "patterns": [r"\bborrow(?:ing)?\s+exceeding\b", r"\bunlimited\s+borrowing\b", r"\btake\s+on\s+debt\s+without\s+approval\b", r"\bsell\s+(?:the\s+)?entire\s+undertaking\b"]
    },
    {
        "id": "SEBI_30",
        "act": "SEBI (LODR) Regulations, 2015",
        "section": "Regulation 30",
        "title": "Disclosure of Material Events",
        "rule": "Listed entities must disclose material events (acquisitions, key management changes, litigation, financial results) to stock exchanges within 30 minutes of board closure or 12/24 hours of occurrence.",
        "patterns": [r"\bdo\s+not\s+disclose\s+to\s+(?:stock\s+exchange|bse|nse|sebi)\b", r"\bkeep\s+(?:acquisition|merger)\s+secret\s+from\s+exchange\b", r"\bmaterial\s+event\b"]
    },
    {
        "id": "CA_173",
        "act": "Companies Act, 2013",
        "section": "Section 173(3)",
        "title": "Notice of Board Meetings",
        "rule": "A meeting of the Board of Directors shall be called by giving not less than seven (7) days' notice in writing to every director.",
        "patterns": [r"\bboard\s+meeting\s+without\s+notice\b", r"\bboard\s+meeting\s+tomorrow\b"]
    },
    {
        "id": "EMP_NOTICE",
        "act": "Industrial Employment (Standing Orders) Act / State Shops & Establishments",
        "section": "Termination & Retrenchment Provisions",
        "title": "Statutory Notice for Employee Termination",
        "rule": "Termination of permanent employees requires statutory notice (typically 30 days) or salary in lieu thereof, accompanied by documented inquiry or performance procedure.",
        "patterns": [r"\bterminate\s+.*tomorrow\b", r"\bfire\s+.*immediately\b", r"\bterminate\s+without\s+notice\b"]
    }
]


class IndianCorpusModule:
    SOURCE_NAME = "Indian Corpus"

    def __init__(self, artifact_dir: str = None):
        self.artifact_dir = artifact_dir

    def analyze(self, meeting_sentence: str) -> Dict[str, Any]:
        text_lower = meeting_sentence.lower()

        for item in INDIAN_STATUTES:
            for pat in item["patterns"]:
                if re.search(pat, text_lower):
                    return {
                        "source": self.SOURCE_NAME,
                        "meeting_sentence": meeting_sentence,
                        "matched_title": f"{item['act']} - {item['section']}",
                        "matched_category": item["title"],
                        "matched_clause": item["rule"],
                        "retrieval_score": 0.94,
                        "compliance": "NON-COMPLIANT" if "do not disclose" in text_lower or "without notice" in text_lower else "NEEDS REVIEW",
                        "reason": f"Under Indian corporate law ({item['act']} {item['section']}), this decision triggers statutory requirements: {item['rule']}",
                        "confidence_scores": {"statute_match": 0.95}
                    }

        # Default compliant state for Indian statutory checks
        return {
            "source": self.SOURCE_NAME,
            "meeting_sentence": meeting_sentence,
            "matched_title": "Companies Act, 2013 & SEBI Regulations",
            "matched_category": "General Corporate Compliance",
            "matched_clause": "Standard statutory oversight under Indian jurisdiction.",
            "retrieval_score": 0.70,
            "compliance": "COMPLIANT",
            "reason": "No direct conflict with Indian corporate statutes (Companies Act 2013 / SEBI LODR) detected.",
            "confidence_scores": {"compliant": 0.9}
        }

    def analyze_batch(self, sentences: List[str]) -> List[Dict[str, Any]]:
        return [self.analyze(s) for s in sentences]
