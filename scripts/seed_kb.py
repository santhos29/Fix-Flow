#!/usr/bin/env python3
"""
FixFlow — Knowledge Base Seeder
Reads known_issues_seed_template.csv, embeds each row with OpenAI,
and upserts into Supabase knowledge_base table.

Usage:
  pip install openai supabase pandas
  python scripts/seed_kb.py
"""

import os, csv, json, time
import google.generativeai as genai
from supabase import create_client

# ── Config ──────────────────────────────────────────────
SUPABASE_URL      = os.environ["SUPABASE_URL"]
SUPABASE_KEY      = os.environ["SUPABASE_SERVICE_KEY"]
GEMINI_API_KEY    = os.environ["GEMINI_API_KEY"]
CSV_PATH          = os.path.join(os.path.dirname(__file__), "../supabase/seed/known_issues_seed_template.csv")
EMBED_MODEL       = "models/gemini-embedding-001"
REVIEW_STATUS     = "approved"   # seed data is pre-validated

# ── Clients ─────────────────────────────────────────────
genai.configure(api_key=GEMINI_API_KEY)
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

def embed(text: str) -> list[float]:
    result = genai.embed_content(
        model=EMBED_MODEL,
        content=text,
        task_type="retrieval_document",
        output_dimensionality=1536
    )
    return result['embedding']

def seed():
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Seeding {len(rows)} known issues into knowledge_base…\n")

    for i, row in enumerate(rows, 1):
        title       = row.get("issue_title", "").strip()
        description = row.get("description", "").strip()
        fix_steps   = row.get("fix_steps", "").strip()
        assigned_to = row.get("assigned_to", "").strip()
        tags        = [t.strip() for t in row.get("tags", "").split(",") if t.strip()]
        paraphrases = [p.strip() for p in [
            row.get("paraphrase_1",""), row.get("paraphrase_2",""), row.get("paraphrase_3","")
        ] if p.strip()]

        # Embed the primary description
        text_to_embed = f"{title}: {description}"
        print(f"[{i}/{len(rows)}] Embedding: {title[:60]}…")
        embedding = embed(text_to_embed)
        time.sleep(0.3)  # rate-limit safety

        record = {
            "issue_title":   title,
            "description":   description,
            "paraphrases":   paraphrases,
            "fix_steps":     fix_steps,
            "assigned_to":   assigned_to,
            "tags":          tags,
            "review_status": REVIEW_STATUS,
            "embedding":     embedding,
        }

        result = sb.table("knowledge_base").insert(record).execute()

        if result.data:
            print(f"   ✅ Inserted: {result.data[0]['id']}")
        else:
            print(f"   ❌ Error inserting row {i}")

        # Also insert paraphrase variants pointing to same fix
        for j, para in enumerate(paraphrases):
            para_embed = embed(f"{title}: {para}")
            time.sleep(0.3)
            para_record = {**record, "description": para, "embedding": para_embed}
            sb.table("knowledge_base").insert(para_record).execute()
            print(f"   ↳ Paraphrase {j+1} embedded")

    print(f"\n✅ Seeding complete. {len(rows)} issues loaded.")

if __name__ == "__main__":
    seed()
