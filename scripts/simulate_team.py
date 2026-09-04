#!/usr/bin/env python3
"""
FixFlow — AI Software Team Simulator
Simulates collaborative software development agents (Manager, Devs, Testers, Clients)
to generate highly realistic, complex bug reports and push them to FixFlow's intake.
"""

import os
import json
import time
import random
import argparse
import requests
from pathlib import Path
import google.generativeai as genai
from openai import OpenAI

# ── Load .env Variables ───────────────────────────────────
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ[key] = val.strip()

# ── Config ──────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
SUPABASE_URL   = os.environ.get("SUPABASE_URL")
SUPABASE_KEY   = os.environ.get("SUPABASE_SERVICE_KEY")

INTAKE_URL = "http://localhost:5678/webhook/fixflow/intake"

# ── Personas ─────────────────────────────────────────────
PERSONAS = {
    "client": {
        "name": "Jane Miller",
        "email": "client.jane@retailcorp.com",
        "role": "Client / Store Manager"
    },
    "manager": {
        "name": "Alex Mercer",
        "email": "alex.mercer@fixflow.co",
        "role": "Product Manager / Scrum Master"
    },
    "frontend_1": {
        "name": "Elena Rostova",
        "email": "elena.r@fixflow.co",
        "role": "Senior UI/UX Developer"
    },
    "frontend_2": {
        "name": "Marcus Vance",
        "email": "marcus.v@fixflow.co",
        "role": "Frontend Platform Engineer"
    },
    "backend_1": {
        "name": "Sanjay Dutt",
        "email": "sanjay.d@fixflow.co",
        "role": "Database Architect & Performance Lead"
    },
    "backend_2": {
        "name": "Rajesh Kumar",
        "email": "rajesh.k@fixflow.co",
        "role": "API Integration & Microservices Engineer"
    },
    "backend_3": {
        "name": "Chloe Dupont",
        "email": "chloe.d@fixflow.co",
        "role": "DevOps & Infrastructure Lead"
    },
    "tester_1": {
        "name": "Sarah Jenkins",
        "email": "sarah.j@fixflow.co",
        "role": "Manual QA / Exploratory Tester"
    },
    "tester_2": {
        "name": "Daniel Park",
        "email": "daniel.p@fixflow.co",
        "role": "Automation Engineer / SDET"
    }
}

# ── Scenario Pool (3 buckets for balanced classification) ────────────────────────────────────────
# KNOWN  → Very common issues that closely match existing KB articles (similarity > 85%)
# MID    → Real but novel technical bugs that partially match KB (similarity 55-85%)
# UNKNOWN → Non-software / facilities / HR issues that don't match any KB article (similarity < 55%)

SCENARIOS_KNOWN = [
    {
        "category": "known_login",
        "reporter": "backend_2",
        "title_template": "Login service timeout",
        "details": "Users are unable to login, requests timeout after 30 seconds"
    },
    {
        "category": "known_payment",
        "reporter": "backend_2",
        "title_template": "Payment gateway 500 error",
        "details": "Payment processing returns 500 Internal Server Error"
    },
    {
        "category": "known_email",
        "reporter": "tester_1",
        "title_template": "Email notifications not sending",
        "details": "System emails (password reset, alerts) not being delivered"
    },
    {
        "category": "known_api_rate",
        "reporter": "backend_2",
        "title_template": "API rate limit 429 errors",
        "details": "Third-party API calls returning 429 Too Many Requests"
    },
    {
        "category": "known_memory_leak",
        "reporter": "backend_3",
        "title_template": "Memory leak in worker service",
        "details": "Worker pod memory usage grows unbounded, OOMKilled after 6h"
    }
]

SCENARIOS_MID = [
    {
        "category": "database",
        "reporter": "backend_1",
        "title_template": "Database deadlock on order_items table during concurrent batch checkout",
        "details": "Sanjay Dutt detects Postgres row-level locks and transaction rollbacks in production logs during bulk checkout updates."
    },
    {
        "category": "frontend_caching",
        "reporter": "frontend_2",
        "title_template": "Auth token refresh race-condition causing random 401 logouts",
        "details": "Marcus Vance reports that concurrent API requests fired during token expiration cause double token refresh requests, invalidating the session."
    },
    {
        "category": "integration",
        "reporter": "backend_2",
        "title_template": "Third-party payment gateway webhook signature validation failure",
        "details": "Rajesh Kumar isolates Stripe signature verify errors to timestamp clock drift between webhook payload and AWS ECS host container."
    },
    {
        "category": "devops",
        "reporter": "backend_3",
        "title_template": "Kubernetes Pod OOMKilled crash loop on image-processor microservice",
        "details": "Chloe Dupont isolates a memory leak in sharp image resize module during parallel upload processing under 300 concurrent requests."
    },
    {
        "category": "ui_rendering",
        "reporter": "frontend_1",
        "title_template": "React re-render infinite loop on checkout cart view in Safari 17",
        "details": "Elena Rostova tracks down an infinite hooks dispatch loop caused by a missing reference dependency array in useMemo initialization."
    },
    {
        "category": "client_urgent",
        "reporter": "client",
        "title_template": "White screen of death on invoice download button click",
        "details": "Jane Miller (client) reports that clicking download completely breaks the dashboard. Sarah Jenkins (QA) attaches browser console stack trace."
    },
    {
        "category": "automation_failed",
        "reporter": "tester_2",
        "title_template": "Cypress automation test suite timeout failure on User Settings save integration",
        "details": "Daniel Park attaches failing automation assertion logs showing API response payload mismatches and unhandled promise rejection."
    },
    {
        "category": "session",
        "reporter": "backend_2",
        "title_template": "Session tokens expiring prematurely causing mid-session logouts",
        "details": "Rajesh Kumar reports that users are being logged out after 5 minutes even though the session TTL is set to 60 minutes. Suspected clock skew between microservices or incorrect token expiry calculation."
    },
    {
        "category": "performance",
        "reporter": "tester_1",
        "title_template": "API response times degraded by 400% on product search endpoint",
        "details": "Sarah Jenkins flags that the product search API is taking 3-4 seconds to respond. Load test shows no issue below 100 concurrent users but degrades sharply above that. Suspected missing index on product_catalog table."
    }
]

SCENARIOS_UNKNOWN = [
    {
        "category": "facilities",
        "reporter": "client",
        "title_template": "Office breakroom coffee machine leaking water on the floor",
        "details": "Jane Miller reports that the primary office coffee maker in the breakroom kitchen is leaking gallons of hot water all over the floor. This is a physical facilities maintenance issue and not a software bug."
    },
    {
        "category": "hr_request",
        "reporter": "manager",
        "title_template": "Employee lost parking garage RFID keycard — needs replacement",
        "details": "Alex Mercer reports that a team member lost their plastic RFID parking garage access card. They need building management to issue a new physical card. This is an HR / facilities request unrelated to software."
    },
    {
        "category": "facilities",
        "reporter": "tester_1",
        "title_template": "Conference room projector bulb burnt out — presentations not possible",
        "details": "Sarah Jenkins reports that the projector in Conference Room B has a burnt out bulb and is unusable. The team has a client presentation tomorrow. This is a physical equipment maintenance request."
    },
    {
        "category": "hr_request",
        "reporter": "manager",
        "title_template": "New joiner laptop not provisioned — no equipment on first day",
        "details": "Alex Mercer submits an urgent request that the new developer joining today has not received their laptop. IT needs to provision hardware immediately. This is an onboarding / HR logistics issue."
    },
    {
        "category": "facilities",
        "reporter": "client",
        "title_template": "Office air conditioning broken — server room temperature rising",
        "details": "Jane Miller reports the office HVAC system has failed and the server room temperature is rising above safe thresholds. Facilities / building management must be contacted immediately. Not a software issue."
    }
]

def generate_bug_report(scenario: dict) -> dict:
    """
    Invokes LLM (OpenAI with Gemini fallback) to generate a detailed, human-like bug report.
    """
    reporter_persona = PERSONAS[scenario["reporter"]]
    
    # Direct bypass for known issues to guarantee 100% similarity score with the knowledge base
    if scenario["category"].startswith("known"):
        return {
            "title": scenario["title_template"],
            "description": scenario["details"],
            "reporter": reporter_persona["email"],
            "source": "webhook"
        }
    other_personas = [p for k, p in PERSONAS.items() if k != scenario["reporter"]]
    participants = [reporter_persona] + random.sample(other_personas, 2)
    
    participants_str = "\n".join([f"- {p['name']} ({p['role']}) - {p['email']}" for p in participants])
    
    prompt = f"""
You are an advanced agentic team simulator. Your goal is to write a highly realistic, detailed engineering bug report.

### SCENARIO:
- Category: {scenario["category"]}
- Base Concept: {scenario["title_template"]}
- Context: {scenario["details"]}

### SIMULATED TEAM PARTICIPANTS:
{participants_str}

### INSTRUCTIONS:
Generate a valid JSON object with the following fields:
1. "title": A professional, realistic, technical GitHub/Jira-style bug title (e.g. "[Database] Deadlock on order_items table under concurrent batch checkout").
2. "description": A rich, comprehensive markdown description of the incident. It MUST include:
   - **Simulated Chat Discussion**: A slack-like transcript between the participants as they detect, discuss, and debug the issue. Make the tone highly realistic, professional, and slightly conversational.
   - **Steps to Reproduce**: Clear, technical step-by-step instructions.
   - **Environment Info**: OS, Browser, Host Container, DB Version where applicable.
   - **Technical Attachments**: Markdown blocks showing simulated logs, database locking queries, stack traces, console exceptions, or failing test assertions.
3. "reporter": The email of the reporter: "{reporter_persona["email"]}".
4. "source": "webhook".

### OUTPUT FORMAT:
You MUST respond with a single JSON block. Do not wrap in backticks or Markdown code formatting. The JSON must be parseable.
"""

    # 1. Try OpenAI if key is available
    if OPENAI_API_KEY:
        try:
            print(f"🤖 Generating incident with OpenAI (GPT-4o-mini) for: {scenario['category']}...")
            client = OpenAI(api_key=OPENAI_API_KEY)
            res = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            return json.loads(res.choices[0].message.content)
        except Exception as e:
            print(f"⚠️ OpenAI generation failed: {e}. Falling back to Gemini...")

    # 2. Fallback to Gemini (with retry on rate-limit)
    if GEMINI_API_KEY:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                print(f"🤖 Generating incident with Gemini (gemini-2.5-flash) for: {scenario['category']} (attempt {attempt+1})...")
                genai.configure(api_key=GEMINI_API_KEY)
                model = genai.GenerativeModel("gemini-2.5-flash")
                
                schema = {
                    "type": "OBJECT",
                    "properties": {
                        "title": {"type": "STRING"},
                        "description": {"type": "STRING"},
                        "reporter": {"type": "STRING"},
                        "source": {"type": "STRING"}
                    },
                    "required": ["title", "description", "reporter", "source"]
                }
                
                res = model.generate_content(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        response_schema=schema,
                        temperature=0.7
                    )
                )
                
                # De-markdown code blocks if any
                text = res.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                
                return json.loads(text)
            except Exception as e:
                err_str = str(e)
                if '429' in err_str and attempt < max_retries - 1:
                    wait_secs = 60 * (attempt + 1)  # 60s, 120s
                    print(f"⏳ Gemini rate-limited (429). Waiting {wait_secs}s before retry...")
                    time.sleep(wait_secs)
                else:
                    print(f"❌ Gemini generation failed: {e}")
                    raise e
    else:
        raise ValueError("Neither OPENAI_API_KEY nor GEMINI_API_KEY is configured in the environment.")

def dispatch_incident(incident: dict) -> bool:
    """
    Sends the generated incident payload to n8n webhook intake.
    """
    try:
        print(f"🚀 Dispatching payload to intake: '{incident['title']}'...")
        res = requests.post(INTAKE_URL, json=incident, headers={"Content-Type": "application/json"})
        print(f"   Response Status: {res.status_code}")
        print(f"   Response Body: {res.text.strip()}")
        return res.status_code == 200
    except Exception as e:
        print(f"❌ Failed to dispatch incident: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="FixFlow AI Agent Software Team Simulator")
    parser.add_argument("--count", type=int, default=5, help="Number of incidents to generate")
    parser.add_argument("--delay", type=int, default=5, help="Seconds delay between webhooks")
    parser.add_argument("--known-only", action="store_true", help="Generate only KNOWN issues (no LLM call, fastest)")
    parser.add_argument("--mid-only", action="store_true", help="Generate only MID issues")
    parser.add_argument("--unknown-only", action="store_true", help="Generate only UNKNOWN issues")
    args = parser.parse_args()

    print("==================================================")
    print("🔥 Starting AI Software Team Simulator")
    print(f"   Count: {args.count} | Delay: {args.delay}s")
    print("==================================================\n")

    success_count = 0

    # Build a balanced pool: for every 5 tickets → 1 known, 2 mid, 2 unknown
    # Scales proportionally for other counts
    pool = []
    n = args.count

    # Override: use a single bucket if a type flag was passed
    if args.known_only:
        pool = random.choices(SCENARIOS_KNOWN, k=n)
        n_known, n_mid, n_unknown = n, 0, 0
    elif args.mid_only:
        pool = random.choices(SCENARIOS_MID, k=n)
        n_known, n_mid, n_unknown = 0, n, 0
    elif args.unknown_only:
        pool = random.choices(SCENARIOS_UNKNOWN, k=n)
        n_known, n_mid, n_unknown = 0, 0, n
    else:
        # Build proportional pool ensuring no bucket is negative
        n_known   = max(0, round(n * 0.20))   # ~20% known
        n_unknown = max(0, round(n * 0.30))   # ~30% unknown
        n_mid     = max(0, n - n_known - n_unknown)  # remaining mid (never negative)
        # Adjust so total = n exactly
        while n_known + n_mid + n_unknown < n:
            n_mid += 1
        while n_known + n_mid + n_unknown > n:
            if n_unknown > 0: n_unknown -= 1
            elif n_mid > 0: n_mid -= 1
            else: n_known -= 1

        if n_known > 0:
            pool += random.choices(SCENARIOS_KNOWN,   k=n_known)
        if n_mid > 0:
            pool += random.choices(SCENARIOS_MID,     k=n_mid)
        if n_unknown > 0:
            pool += random.choices(SCENARIOS_UNKNOWN, k=n_unknown)
        random.shuffle(pool)  # randomise order so types are interleaved

    print(f"   Distribution → Known: {n_known} | Mid: {n_mid} | Unknown: {n_unknown}\n")


    for i, scenario in enumerate(pool):
        print(f"=== [Incident {i+1}/{args.count}] ===")
        try:
            incident = generate_bug_report(scenario)
            
            # Dispatch to n8n webhook
            ok = dispatch_incident(incident)
            if ok:
                success_count += 1
            
            # Rate limiting / processing safety delay
            if i < args.count - 1:
                print(f"⏳ Sleeping {args.delay} seconds before next generation...\n")
                time.sleep(args.delay)
                
        except Exception as e:
            print(f"❌ Error during generation of incident {i+1}: {e}\n")

    print(f"\n✅ Simulation Batch Completed! {success_count}/{args.count} successfully sent to FixFlow.")

if __name__ == "__main__":
    main()
