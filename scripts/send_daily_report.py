#!/usr/bin/env python3
"""
FixFlow — Daily Operations Summary & Suggestions Reporter
Fetches recent tickets, calls Gemini to generate professional resolution suggestions 
for unresolved issues, compiles a premium HTML email report, and sends it via SMTP.
"""

import os
import sys
import json
import smtplib
from pathlib import Path
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import requests

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
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# SMTP Configuration for Daily Report Emails
SMTP_SERVER   = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT     = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
EMAIL_TO      = os.environ.get("EMAIL_TO", "santhosk738@gmail.com")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file.")
    sys.exit(1)

def get_suggestions(title, description):
    """Call Gemini to get a concise, professional engineering fix suggestion."""
    if not GEMINI_API_KEY:
        return "Gemini API key missing. Could not generate live suggestions."
    
    prompt = f"""
You are the Principal Solutions Architect at a top-tier software company. 
Analyze the following production bug report and suggest a highly professional, 
concise step-by-step technical fix (2-3 sentences max) that a senior engineer can implement.

### BUG TITLE:
{title}

### BUG DESCRIPTION:
{description}

### FORMAT REQUIREMENT:
Return ONLY the 2-3 sentences of direct, practical suggestion. Do not say "Here is a suggestion" or write introductory text.
"""
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    body = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    try:
        res = requests.post(url, headers=headers, json=body, timeout=15)
        if res.status_code == 200:
            data = res.json()
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])
            text = parts[0].get("text", "").strip()
            return text if text else "No suggestions returned by AI."
        else:
            return f"AI Suggestion generation failed (Status code: {res.status_code})"
    except Exception as e:
        return f"AI Suggestion service error: {str(e)}"

def run_report():
    print("==================================================")
    print("📧 Running Daily FixFlow Email Operations Report")
    print("==================================================\n")
    
    # 1. Fetch Issues from Supabase
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    print("🔍 Fetching issues from database...")
    issues_url = f"{SUPABASE_URL}/rest/v1/issues?select=*&order=created_at.desc"
    
    try:
        res = requests.get(issues_url, headers=headers, timeout=15)
        if res.status_code != 200:
            print(f"❌ Failed to fetch issues from Supabase. Status: {res.status_code}")
            sys.exit(1)
        issues = res.json()
    except Exception as e:
        print(f"❌ Network error while fetching issues: {str(e)}")
        sys.exit(1)
    
    # 2. Filter Issues from the Last 24 Hours
    now = datetime.now()
    twenty_four_hours_ago = now - timedelta(hours=24)
    
    today_issues = []
    for issue in issues:
        created_at_str = issue.get("created_at")
        if created_at_str:
            # Strip offset and microseconds for simple ISO parsing in Python 3.10
            clean_ts = created_at_str.split('+')[0].split('Z')[0].split('.')[0]
            created_at = datetime.fromisoformat(clean_ts)
            # Compare (note: assumes DB timezone and python run timezone align relatively)
            if created_at > twenty_four_hours_ago:
                today_issues.append(issue)
                
    print(f"   Found {len(today_issues)} issues created or updated in the last 24 hours.")
    
    # 3. Categorize & Generate AI Suggestions
    solved_count = 0
    in_progress_count = 0
    open_count = 0
    unknown_count = 0
    mid_count = 0
    known_count = 0
    
    suggestions_table_rows = []
    
    for idx, issue in enumerate(today_issues):
        status = issue.get("status")
        agent = issue.get("agent_type")
        title = issue.get("title", "Untitled Issue")
        desc = issue.get("description", "")
        jira_id = issue.get("jira_ticket_id", "N/A")
        payload = issue.get("raw_payload") or {}
        reporter = issue.get("assigned_to") or (payload.get("reporter") if isinstance(payload, dict) else None) or "Unknown"
        
        # Count status
        if status == "closed":
            solved_count += 1
        elif status == "in_progress":
            in_progress_count += 1
        else:
            open_count += 1
            
        # Count agents
        if agent == "known":
            known_count += 1
        elif agent == "mid":
            mid_count += 1
        elif agent == "unknown":
            unknown_count += 1
            
        # Generate suggestions for Unresolved Unknown & Mid issues
        if status != "closed" and agent in ["unknown", "mid"]:
            print(f"🤖 Generating AI Suggestion for outstanding ticket: {title[:50]}...")
            suggestion = get_suggestions(title, desc)
            
            # Format rows
            bg_color = "#FFF9C4" if agent == "mid" else "#FFEBEE"
            badge_color = "#FBC02D" if agent == "mid" else "#D32F2F"
            badge_text = "Mid-Level" if agent == "mid" else "Critical Unknown"
            
            row = f"""
            <tr style="border-bottom: 1px solid #E0E0E0;">
                <td style="padding: 12px; font-weight: bold; color: #333;">{title}</td>
                <td style="padding: 12px;"><span style="background-color: {badge_color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">{badge_text}</span></td>
                <td style="padding: 12px; color: #1976D2; font-weight: bold;">{jira_id}</td>
                <td style="padding: 12px; font-size: 13px; line-height: 1.4; color: #424242; background-color: {bg_color}; border-radius: 4px;">{suggestion}</td>
            </tr>
            """
            suggestions_table_rows.append(row)
            
    # 4. Draft Premium HTML Email Template
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>FixFlow Daily Operations Summary</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F7FA; margin: 0; padding: 0; color: #333;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F7FA; padding: 30px 0;">
            <tr>
                <td align="center">
                    <table width="650" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #E1E4E8;">
                        <!-- HEADER -->
                        <tr style="background: linear-gradient(135deg, #1E3C72, #2A5298); color: white;">
                            <td style="padding: 30px; text-align: center;">
                                <h1 style="margin: 0; font-size: 26px; letter-spacing: 1px;">FixFlow</h1>
                                <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.85; font-weight: bold;">AUTOMATED SOFTWARE TEAM WORKFLOW SUMMARY</p>
                                <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.70;">Date: {now.strftime('%B %d, %Y')}</p>
                            </td>
                        </tr>
                        
                        <!-- SUMMARY CARDS -->
                        <tr>
                            <td style="padding: 30px 30px 10px 30px;">
                                <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #1E3C72; border-bottom: 2px solid #EAF0F6; padding-bottom: 10px;">Daily Operations KPI Dashboard</h2>
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <!-- Solved Card -->
                                        <td width="30%" align="center" style="background-color: #E8F5E9; border: 1px solid #C8E6C9; padding: 15px; border-radius: 6px;">
                                            <div style="font-size: 24px; font-weight: bold; color: #2E7D32;">{solved_count}</div>
                                            <div style="font-size: 12px; color: #558B2F; margin-top: 5px; font-weight: bold;">Tickets Solved</div>
                                        </td>
                                        <td width="5%">&nbsp;</td>
                                        <!-- In Progress Card -->
                                        <td width="30%" align="center" style="background-color: #FFF3E0; border: 1px solid #FFE0B2; padding: 15px; border-radius: 6px;">
                                            <div style="font-size: 24px; font-weight: bold; color: #EF6C00;">{in_progress_count}</div>
                                            <div style="font-size: 12px; color: #E65100; margin-top: 5px; font-weight: bold;">In Progress</div>
                                        </td>
                                        <td width="5%">&nbsp;</td>
                                        <!-- Total Ingested -->
                                        <td width="30%" align="center" style="background-color: #E3F2FD; border: 1px solid #BBDEFB; padding: 15px; border-radius: 6px;">
                                            <div style="font-size: 24px; font-weight: bold; color: #1565C0;">{len(today_issues)}</div>
                                            <div style="font-size: 12px; color: #0D47A1; margin-top: 5px; font-weight: bold;">Total Issues Today</div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- CLASSIFICATION DETAILS -->
                        <tr>
                            <td style="padding: 10px 30px 20px 30px;">
                                <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #F8F9FA; border-radius: 6px; border: 1px solid #E9ECEF; font-size: 13px;">
                                    <tr>
                                        <td><strong>Known Solved:</strong> {known_count}</td>
                                        <td><strong>Mid-Level Assigned:</strong> {mid_count}</td>
                                        <td><strong>Critical Unknown:</strong> {unknown_count}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- SUGGESTIONS & SUGGESTIONS SECTION -->
                        <tr>
                            <td style="padding: 10px 30px 30px 30px;">
                                <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1E3C72; border-bottom: 2px solid #EAF0F6; padding-bottom: 10px;">Outstanding Escalated Incidents & Resolution Advice</h2>
                                
                                {f'''
                                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; text-align: left;">
                                    <thead>
                                        <tr style="background-color: #F1F3F5; font-size: 12px; color: #495057; text-transform: uppercase;">
                                            <th style="padding: 10px; border-bottom: 2px solid #DEE2E6;">Issue</th>
                                            <th style="padding: 10px; border-bottom: 2px solid #DEE2E6;">Type</th>
                                            <th style="padding: 10px; border-bottom: 2px solid #DEE2E6;">Jira ID</th>
                                            <th style="padding: 10px; border-bottom: 2px solid #DEE2E6;">AI Resolution Suggestions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {"".join(suggestions_table_rows)}
                                    </tbody>
                                </table>
                                ''' if suggestions_table_rows else '<p style="color: #666; font-style: italic; background-color: #E8F5E9; padding: 15px; border-radius: 4px; text-align: center;">🎉 Excellent! All incidents resolved. Zero outstanding escalated issues requiring attention today!</p>'}
                            </td>
                        </tr>

                        <!-- FOOTER -->
                        <tr style="background-color: #1E2D4A; color: #A6B4C9; font-size: 12px; text-align: center;">
                            <td style="padding: 20px;">
                                <p style="margin: 0;">This report is 100% automated by your FixFlow Autonomous Operations Agent.</p>
                                <p style="margin: 5px 0 0 0;">Supabase URL: {SUPABASE_URL}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    # 5. Send Report via SMTP or Save Locally
    report_file_path = Path(__file__).parent.parent / 'scratch' / 'daily_report.html'
    report_file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_file_path, 'w') as f:
        f.write(html_content)
        
    print(f"📝 Local report successfully saved to: {report_file_path}")
    
    # Validate SMTP credentials
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("\n==================================================")
        print("⚠️ WARNING: SMTP credentials missing in .env")
        print("==================================================")
        print("   Daily report was successfully saved locally to:")
        print(f"   [report.html]({report_file_path.as_uri()})")
        print("\n   To receive emails, please add these keys to your .env file:")
        print("   SMTP_USERNAME = <your_email@gmail.com>")
        print("   SMTP_PASSWORD = <your_app_password>")
        print("   EMAIL_TO      = <recipient_email>")
        print("==================================================\n")
        return
        
    # Send Email
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"FixFlow Daily Operations & AI Suggestions — {now.strftime('%m/%d/%Y')}"
    msg['From'] = SMTP_USERNAME
    msg['To'] = EMAIL_TO
    
    part_html = MIMEText(html_content, 'html')
    msg.attach(part_html)
    
    try:
        print(f"🚀 Connecting to SMTP server {SMTP_SERVER}:{SMTP_PORT}...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        print(f"📬 Sending daily operations report to: {EMAIL_TO}...")
        server.sendmail(SMTP_USERNAME, [EMAIL_TO], msg.as_string())
        server.quit()
        print("✅ Email successfully sent!")
    except Exception as e:
        print(f"❌ Failed to send email via SMTP: {str(e)}")
        print("   The report is preserved locally in the scratch directory.")

if __name__ == "__main__":
    run_report()
