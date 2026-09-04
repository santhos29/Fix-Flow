#!/usr/bin/env python3
"""
FixFlow — Jira Transition ID Helper
Run this ONCE after creating your Jira project to find the
correct transition IDs for "In Progress" and "Done" statuses.
Then update workflow_B_known_issue_agent.json with the right IDs.

Usage:
  python scripts/get_jira_transitions.py MAINT-1
"""
import os, sys, requests
from base64 import b64encode

JIRA_BASE_URL  = os.environ["JIRA_BASE_URL"]
JIRA_EMAIL     = os.environ["JIRA_EMAIL"]
JIRA_API_TOKEN = os.environ["JIRA_API_TOKEN"]

def get_transitions(ticket_id: str):
    auth = b64encode(f"{JIRA_EMAIL}:{JIRA_API_TOKEN}".encode()).decode()
    headers = {"Authorization": f"Basic {auth}", "Accept": "application/json"}
    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{ticket_id}/transitions"

    resp = requests.get(url, headers=headers)
    resp.raise_for_status()

    transitions = resp.json()["transitions"]
    print(f"\nTransitions available for {ticket_id}:\n")
    print(f"{'ID':<6} {'Name':<25} {'To Status'}")
    print("-" * 50)
    for t in transitions:
        print(f"{t['id']:<6} {t['name']:<25} {t['to']['name']}")

    print("\n📋 Update these values in n8n/workflows/workflow_B_known_issue_agent.json:")
    for t in transitions:
        if "progress" in t["to"]["name"].lower():
            print(f"   'In Progress' transition ID = {t['id']}")
        if "done" in t["to"]["name"].lower() or "closed" in t["to"]["name"].lower():
            print(f"   'Done' transition ID        = {t['id']}")

if __name__ == "__main__":
    ticket = sys.argv[1] if len(sys.argv) > 1 else "MAINT-1"
    get_transitions(ticket)
