# FixFlow — Step-by-Step Setup Guide

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Docker Desktop | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| Python | ≥ 3.10 | [python.org](https://www.python.org) |
| Git | Any | Included on Mac |

---

## Step 1 — Environment Variables

```bash
cd /Users/santhos/Documents/Projects/FixFlow
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Where to get it |
|---|---|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase Dashboard → Settings → API → `service_role` |
| `JIRA_BASE_URL` | `https://yourcompany.atlassian.net` |
| `JIRA_EMAIL` | Your Atlassian account email |
| `JIRA_API_TOKEN` | [id.atlassian.com → Security → API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `N8N_ENCRYPTION_KEY` | Run: `openssl rand -hex 32` |

---

## Step 2 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `fixflow`, choose a region close to you
3. Open **SQL Editor** (left sidebar)
4. Copy entire contents of `supabase/migrations/001_initial_schema.sql`
5. Paste into SQL Editor → **Run** (green button)
6. Verify tables were created: Table Editor → you should see `issues`, `knowledge_base`, `resolution_log`, `test_cases`, `system_config`, `assignee_module_map`

---

## Step 3 — Jira Setup

1. Go to [atlassian.com/software/jira](https://www.atlassian.com/software/jira) → Start free
2. Create a **Scrum** project → Key: `MAINT`
3. Add custom fields (Project Settings → Fields → Create field):
   - `Agent Type` — Short text
   - `AI Confidence Score` — Number
4. Ensure statuses exist: `To Do → In Progress → Done`
5. Create your API token and set in `.env`

---

## Step 4 — Start n8n

```bash
cd /Users/santhos/Documents/Projects/FixFlow
docker compose up -d
```

- Open: **http://localhost:5678**
- Login: `admin` / `changeme` (or whatever you set in `.env`)

### Add Credentials in n8n

Go to **Settings → Credentials → Add Credential**:

| Credential | Type | Fields |
|---|---|---|
| OpenAI | OpenAI API | API Key |
| Supabase | Generic HTTP (Header Auth) | `apikey: <service_key>` |
| Jira | Jira API | Base URL, Email, API Token |

### Import Workflows

1. Go to **Workflows → Import from File**
2. Import in order:
   - `n8n/workflows/workflow_A_intake_classifier.json`
   - `n8n/workflows/workflow_B_known_issue_agent.json`
   - `n8n/workflows/workflow_C_unknown_issue_agent.json`
   - `n8n/workflows/workflow_D_mid_level_agent.json`
   - `n8n/workflows/workflow_E_ticket_closure_kb.json`
   - `n8n/workflows/workflow_F_regression_test.json`
3. In each workflow, click nodes that use credentials → select the credentials you just added
4. **Activate** all 6 workflows (toggle top-right)

### Get Jira Transition IDs

```bash
pip install requests
python scripts/get_jira_transitions.py MAINT-1
```

Copy the "In Progress" ID and update `workflow_B_known_issue_agent.json`:
Find `"id": "21"` and replace `21` with your actual transition ID.

---

## Step 5 — Seed the Knowledge Base

```bash
pip install openai supabase pandas
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="eyJ..."
export OPENAI_API_KEY="sk-..."
python scripts/seed_kb.py
```

This will embed and load the 5 sample issues from the CSV template.
**Before running:** edit `supabase/seed/known_issues_seed_template.csv` with your real team's top 20–30 issues.

---

## Step 6 — Start the Dashboard

```bash
cd /Users/santhos/Documents/Projects/FixFlow/dashboard
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

```bash
npm run dev
```

Open: **http://localhost:3000**

---

## Step 7 — Send a Test Issue

```bash
curl -X POST http://localhost:5678/webhook/fixflow/intake \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Login service timeout",
    "description": "Users are unable to login, requests timeout after 30 seconds. Multiple users affected.",
    "source": "webhook",
    "reporter": "dev@company.com"
  }'
```

Expected result:
- ✅ Jira ticket created: `MAINT-1`
- ✅ Solution posted as comment
- ✅ Ticket assigned and moved to "In Progress"
- ✅ Issue logged in Supabase
- ✅ Visible in dashboard at `http://localhost:3000/tickets`

---

## Step 8 — Load Golden Dataset & Test

```bash
# In Supabase SQL Editor, run:
# supabase/seed/golden_dataset.sql
```

Then trigger Workflow F manually in n8n (open workflow → click "Execute Workflow").

Check Analytics page for your first classifier accuracy score.

---

## Step 9 — Shadow Mode (1–2 weeks before go-live)

1. Open dashboard → **Settings**
2. Toggle **Shadow Mode** → ON
3. All agent logic runs but Jira writes are skipped
4. Review the Analytics page daily for misclassifications
5. Once accuracy > 90% consistently → toggle Shadow Mode OFF

---

## Step 10 — Configure Jira Webhook (for auto-close)

In Jira: **Project Settings → Automation → Create Rule**

- **Trigger:** Issue transitioned → Status = Done
- **Action:** Send web request
  - URL: `http://your-n8n-host:5678/webhook/fixflow/jira-done`
  - Method: POST
  - Body:
    ```json
    {"issue": {"key": "{{issue.key}}", "fields": {"status": {"name": "{{issue.status.name}}"}}}}
    ```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| n8n not starting | Check `docker logs fixflow_n8n` |
| Embedding fails | Verify `OPENAI_API_KEY` in `.env` |
| Supabase RPC returns empty | Check `review_status = 'approved'` on KB entries |
| Jira 401 error | API token may be expired — regenerate at Atlassian |
| Dashboard shows no data | Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` |
| Transition ID wrong | Run `python scripts/get_jira_transitions.py MAINT-1` |
