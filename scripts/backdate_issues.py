#!/usr/bin/env python3
"""
FixFlow — Simulation Backdating Helper
Query simulated issues from Supabase and backdate their timestamps uniformly
over the past 10 days (5 issues per day) to generate realistic timeline charts and KPIs.
"""

import os
import random
from pathlib import Path
from datetime import datetime, timedelta
from supabase import create_client

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
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file.")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

def backdate_issues():
    print("==================================================")
    print("📅 Starting Supabase Simulation Backdating Sync")
    print("==================================================\n")

    # 1. Fetch recent simulated issues (or just all issues to distribute)
    print("🔍 Fetching issues from Supabase...")
    res = sb.table("issues").select("*").order("created_at", desc=True).execute()
    issues = res.data

    if not issues:
        print("⚠️ No issues found in the database.")
        return

    print(f"   Found {len(issues)} total issues in database.")

    # Let's filter to issues that are simulated (from @fixflow.co or @retailcorp.com, or all recent)
    simulated_issues = [
        issue for issue in issues 
        if "[KNOWN]" in issue.get("title", "") or 
           "[MID]" in issue.get("title", "") or 
           "[UNKNOWN]" in issue.get("title", "")
    ]
    
    # If no prefixed issues found, backdate all issues to ensure graphs work
    if not simulated_issues:
        print("ℹ️ No specific AI-simulated issues found (by prefix). Backdating all issues...")
        simulated_issues = issues
    else:
        print(f"ℹ️ Found {len(simulated_issues)} AI-prefixed simulated issues to backdate.")

    # Sort them oldest to newest (or arbitrary order) to distribute chronologically
    simulated_issues.reverse()

    # 2. Distribute issues uniformly over 10 days
    # We want 5 issues per day for 10 days. 
    # If we have N issues, we distribute them across the past 10 days.
    num_issues = len(simulated_issues)
    now = datetime.now()
    
    print(f"⏳ Redistributing {num_issues} issues uniformly over the past 10 days...")
    
    for idx, issue in enumerate(simulated_issues):
        issue_id = issue["id"]
        
        # Calculate a simulated date
        # E.g. spread them evenly
        day_offset = 10 - int((idx / num_issues) * 10) # 10 down to 0 days ago
        # Add random hours and minutes so they don't all cluster at the same time
        hour = random.randint(8, 20)
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        
        sim_created_at = now - timedelta(days=day_offset)
        sim_created_at = sim_created_at.replace(hour=hour, minute=minute, second=second, microsecond=0)
        
        # Determine resolved_at and updated_at
        status = issue.get("status")
        sim_updated_at = sim_created_at + timedelta(minutes=random.randint(5, 30))
        
        resolved_at = None
        if status == "closed":
            resolved_at = (sim_created_at + timedelta(minutes=random.randint(2, 10))).isoformat()
        
        # Update the issue timestamps
        update_payload = {
            "created_at": sim_created_at.isoformat(),
            "updated_at": sim_updated_at.isoformat()
        }
        if resolved_at:
            update_payload["resolved_at"] = resolved_at
            
        print(f"   [{idx+1}/{num_issues}] Issue ID {issue_id[:8]} -> Created: {sim_created_at.strftime('%Y-%m-%d %H:%M:%S')} ({status})")
        
        sb.table("issues").update(update_payload).eq("id", issue_id).execute()
        
        # Also update corresponding resolution_log entry created_at if it exists
        res_log = sb.table("resolution_log").select("*").eq("issue_id", issue_id).execute()
        if res_log.data:
            for log_entry in res_log.data:
                log_id = log_entry["id"]
                log_created_at = resolved_at if resolved_at else sim_updated_at.isoformat()
                sb.table("resolution_log").update({"created_at": log_created_at}).eq("id", log_id).execute()
                print(f"      ↳ Updated resolution_log {log_id[:8]} -> {log_created_at}")

    print("\n✅ Supabase timestamps successfully backdated! Dashboard analytics graphs should now be populated.")

if __name__ == "__main__":
    backdate_issues()
