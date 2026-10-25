#!/usr/bin/env bash
# ==============================================================================
# BEACON - AI Legal Meeting Intelligence Platform
# Unified Start & Build Script
# ==============================================================================

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

COMMAND="${1:-start}"

echo "======================================================================"
echo "  BEACON Legal Meeting Intelligence Platform"
echo "  Directory: $PROJECT_ROOT"
echo "======================================================================"

case "$COMMAND" in
  start|server)
    echo ">> Starting BEACON Unified Platform on http://localhost:8000..."
    python3 start.py
    ;;

  build)
    echo ">> Building React frontend and standalone bundle..."
    cd frontend && node build.mjs
    cd "$PROJECT_ROOT"
    cp frontend/dist/index.html dist/beacon-standalone.html
    echo ">> Build complete! Generated:"
    echo "   - frontend/dist/index.html"
    echo "   - dist/beacon-standalone.html"
    ;;

  dev)
    echo ">> Starting Frontend Development Server on http://localhost:5173..."
    cd frontend && node build.mjs --serve
    ;;

  test)
    echo ">> Running compliance and pipeline verification..."
    python3 -c "
from compliance.compliance_engine import ComplianceEngine
engine = ComplianceEngine()
res = engine.analyze('Our employee is free to start a competing business the day after leaving the company.')
print('Compliance Test Result:', res['overall_compliance'])
assert res['overall_compliance'] in ['NON-COMPLIANT', 'NEEDS REVIEW']

from pipeline.pipeline_runner import run_pipeline
pipe = run_pipeline(transcript_text='[0.0 - 5.0] We will terminate John tomorrow.')
print('Pipeline Test Completed Stages:', pipe['stages_completed'])
assert 'fact_extraction' in pipe['stages_completed']
print('ALL VERIFICATION CHECKS PASSED!')
"
    ;;

  help|*)
    echo "Usage: ./run.sh [start|build|dev|test|help]"
    echo ""
    echo "Commands:"
    echo "  start   - Launch backend API server and web app on http://localhost:8000 (default)"
    echo "  build   - Build frontend and generate single-file dist/beacon-standalone.html"
    echo "  dev     - Start frontend dev server on http://localhost:5173"
    echo "  test    - Run automated verification for compliance engine & pipeline"
    ;;
esac
