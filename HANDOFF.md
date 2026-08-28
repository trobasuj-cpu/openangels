# OpenAngels Master Project Context & Handoff
> **Refer to [MASTER_INSTRUCTIONS_AND_ARCHITECTURE.md](file:///d:/Users/00001/openangels/MASTER_INSTRUCTIONS_AND_ARCHITECTURE.md) for complete details.**

## Key Rules for Agents
1. **Zero Regression Rule**: NEVER break or remove existing working features (4,267 verified investors, Knowledge Graph, CRM, AI Email Drafter, Gumroad).
2. **Honesty & Transparency Rule**: Always check the codebase first. If a feature or task is already implemented, state it explicitly with file links.
3. **Proactive Innovation**: Suggest and implement optimizations, bug fixes, and improvements within the roadmap.

## Quick Status
- **Frontend**: Next.js 16 (App Router), Tailwind CSS, Lucide icons.
- **Database**: Supabase PostgreSQL (`investors`, `profiles`, `crm_leads`, `investor_queue`).
- **Data Engine**: 14-Stage Data Quality & OSINT Engine (`data_pipeline/openangels_data_engine.py`).
- **Runner**: `run_master.bat` (Modes 1, 2, and 3).
