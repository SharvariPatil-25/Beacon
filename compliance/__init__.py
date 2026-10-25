"""
compliance package
------------------
Provides legal compliance evaluation for meeting sentences and key decisions.
"""

from compliance.compliance_engine import ComplianceEngine, split_into_sentences
from compliance.cuad_module import CUADModule
from compliance.indian_module import IndianCorpusModule
from compliance.legal_signals import LegalSignals

__all__ = [
    "ComplianceEngine",
    "split_into_sentences",
    "CUADModule",
    "IndianCorpusModule",
    "LegalSignals",
]
