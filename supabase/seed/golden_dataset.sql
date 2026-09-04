-- ============================================================
-- FixFlow — Golden Dataset (50 Test Cases)
-- Run in Supabase SQL Editor AFTER seeding the knowledge_base
-- Adjust expected_kb_id values to match your actual KB UUIDs
-- ============================================================

-- ── CATEGORY: exact_known (15 cases) ───────────────────────
INSERT INTO test_cases (title, description, expected_agent, category, notes) VALUES
('Login service timeout',
 'Users are unable to login, requests timeout after 30 seconds. Multiple users reporting the issue simultaneously.',
 'known', 'exact_known', 'Should match KB entry exactly'),

('Login page not responding',
 'The login page is hanging and timing out for all users. Session requests are failing with 30s timeout.',
 'known', 'near_known', 'Paraphrase of login timeout issue'),

('Authentication failing',
 'Users cannot sign in. The auth service is returning timeout errors after waiting 30 seconds.',
 'known', 'near_known', 'Another paraphrase of login timeout'),

('Payment gateway 500 error',
 'Payment processing returns 500 Internal Server Error. Checkout is completely broken.',
 'known', 'exact_known', 'Should match payments KB entry'),

('Checkout failing with server error',
 'Getting 500 error when users try to complete payment. Transactions failing at final step.',
 'known', 'near_known', 'Paraphrase of payment 500 error'),

('Email notifications not sending',
 'System emails like password reset and alerts are not being delivered to users.',
 'known', 'exact_known', 'SMTP/SendGrid known issue'),

('Password reset email not received',
 'Users report they never get the password reset email. Notification pipeline appears broken.',
 'known', 'near_known', 'Paraphrase of email notifications'),

('API rate limit 429 errors',
 'Third-party API calls returning 429 Too Many Requests. Seeing these errors flooding the logs.',
 'known', 'exact_known', 'Rate limiting known issue'),

('External API throttling requests',
 'Getting rate limited on external API integrations. 429 errors appearing in logs at high frequency.',
 'known', 'near_known', 'Paraphrase of rate limit issue'),

('Memory leak in worker service',
 'Worker pod memory usage grows unbounded. Pod is getting OOMKilled after approximately 6 hours.',
 'known', 'exact_known', 'Memory leak known issue'),

('Worker service crashing with OOM',
 'Background job processor keeps running out of memory and crashing. OOM errors in pod logs.',
 'known', 'near_known', 'Paraphrase of memory leak'),

('Login not working timeout error',
 'Cannot log in to the application. Login requests timeout after about half a minute.',
 'known', 'exact_known', 'Direct paraphrase from KB'),

('Payments broken getting 500',
 'The entire payment flow is down. Every checkout attempt results in a 500 internal server error.',
 'known', 'near_known', 'Paraphrase of payment issue'),

('Emails not arriving to users',
 'No system emails are being delivered. Both transactional and alert emails are not reaching users.',
 'known', 'near_known', 'Paraphrase of email issue'),

('Memory usage keeps growing in worker',
 'The worker service memory consumption is continuously increasing without being released.',
 'known', 'near_known', 'Another paraphrase of memory leak');

-- ── CATEGORY: mid_level (15 cases) ─────────────────────────
INSERT INTO test_cases (title, description, expected_agent, category, notes) VALUES
('Slow login response',
 'Login is taking much longer than usual, around 15 seconds, but eventually succeeds. No complete timeouts yet.',
 'mid', 'mid_level', 'Partial match to login timeout - not yet failing completely'),

('Occasional payment failures',
 'About 10% of payment transactions are failing with 500 errors intermittently. Most succeed.',
 'mid', 'mid_level', 'Partial match to payment 500 - intermittent only'),

('Some emails delayed',
 'Notification emails are being delivered but with a 2-4 hour delay instead of instantly.',
 'mid', 'mid_level', 'Related to email but different root cause'),

('API responses slow but not failing',
 'External API calls are taking 8-10 seconds instead of under 1 second. No 429 errors yet.',
 'mid', 'mid_level', 'Related to API rate limiting but not failing'),

('Worker memory growing slowly',
 'Worker service memory increases by about 50MB per hour. Has not OOMKilled yet after 12h.',
 'mid', 'mid_level', 'Related to memory leak but slower progression'),

('Intermittent 503 errors on API gateway',
 'Users are occasionally seeing 503 errors on the main API gateway. Happens roughly once per hour.',
 'mid', 'mid_level', 'Partial match to known service issues'),

('High CPU usage on auth service',
 'Auth service CPU is consistently at 85-90%. No failures yet but response times are increasing.',
 'mid', 'mid_level', 'Related to auth/login but different metric'),

('Notification emails going to spam',
 'System emails are being delivered but landing in spam folders. SPF/DKIM possibly misconfigured.',
 'mid', 'mid_level', 'Related to email issue but different cause'),

('API integration returning partial data',
 'Third-party API calls succeed but response payloads are missing some expected fields.',
 'mid', 'mid_level', 'Related to API but different issue'),

('Worker job queue backing up',
 'Background job queue has grown to 50,000 pending items. Jobs are processing but too slowly.',
 'mid', 'mid_level', 'Related to worker but different manifestation'),

('Payment webhook timeouts',
 'Stripe payment webhooks are timing out before our endpoint responds. Events being retried.',
 'mid', 'mid_level', 'Related to payments but webhook not processing side'),

('Login works but session expires too quickly',
 'Users can login but their session expires after 5 minutes instead of the expected 24 hours.',
 'mid', 'mid_level', 'Related to auth but session management issue'),

('Email attachments not being sent',
 'Notification emails are delivering but without their PDF attachments. Body arrives fine.',
 'mid', 'mid_level', 'Related to email but specific to attachments'),

('Database connections spiking',
 'DB connection pool usage spikes to 80% during business hours. No failures but concerning.',
 'mid', 'mid_level', 'Related to DB which underlies known issues'),

('Worker taking 10x longer than usual',
 'Background jobs are completing but each job takes 10x the normal processing time.',
 'mid', 'mid_level', 'Related to worker performance not memory');

-- ── CATEGORY: unknown (10 cases) ───────────────────────────
INSERT INTO test_cases (title, description, expected_agent, category, notes) VALUES
('GraphQL subscriptions disconnecting',
 'WebSocket connections for GraphQL subscriptions are dropping every 90 seconds consistently. Affects all real-time features.',
 'unknown', 'unknown', 'No KB match expected - websocket/subscription issue'),

('PDF generation hanging',
 'The report generation service gets stuck indefinitely when generating PDFs larger than 5MB. Process never completes.',
 'unknown', 'unknown', 'No KB match - PDF generation service'),

('Search index out of sync',
 'Elasticsearch index is 48 hours behind live data. New records not appearing in search results.',
 'unknown', 'unknown', 'No KB match - search infrastructure'),

('Multi-factor authentication bypass',
 'Users are able to bypass MFA on account recovery flow. Security vulnerability discovered in penetration test.',
 'unknown', 'unknown', 'Security issue - no KB match'),

('Mobile push notifications silent',
 'iOS and Android push notifications are silently failing. No errors in logs but notifications not delivered.',
 'unknown', 'unknown', 'Push notification infrastructure - no KB match'),

('Data export corrupting CSV files',
 'Large data exports are producing corrupted CSV files with garbled UTF-8 characters for non-ASCII content.',
 'unknown', 'unknown', 'Encoding issue - no KB match'),

('Cache invalidation race condition',
 'Redis cache is serving stale data immediately after updates. Cache keys not being invalidated atomically.',
 'unknown', 'unknown', 'Cache consistency issue - no KB match'),

('Timezone conversion errors',
 'Scheduled reports are running at wrong times for users in non-UTC timezones. DST transitions cause 1h offset.',
 'unknown', 'unknown', 'Timezone handling - no KB match'),

('Webhook signature verification failing',
 'HMAC webhook signature verification is intermittently rejecting valid payloads from our payment provider.',
 'unknown', 'unknown', 'Cryptographic/timing issue - no KB match'),

('Database deadlocks during bulk import',
 'Concurrent bulk import operations are causing database deadlocks. Transactions rolling back under load.',
 'unknown', 'unknown', 'DB deadlock - no KB match');

-- ── CATEGORY: edge_case (10 cases) ─────────────────────────
INSERT INTO test_cases (title, description, expected_agent, category, notes) VALUES
('System is slow',
 'Everything seems slow today.',
 'unknown', 'edge_case', 'Too vague - should go to unknown due to low similarity'),

('Login AND payments both broken',
 'Users cannot login. Also the payment system is returning 500 errors. Both issues happening simultaneously.',
 'known', 'edge_case', 'Multi-issue - should match whichever is highest similarity'),

('Email',
 'Email.',
 'unknown', 'edge_case', 'Extremely short - should go to unknown'),

('The thing that was broken before is broken again',
 'We had that same issue from last month. The one with the timeouts. Its happening again.',
 'known', 'edge_case', 'Vague reference to past issue - may or may not match'),

('Worker is fine but users are complaining',
 'Workers are healthy, memory is stable, but users are reporting very slow response times on checkout.',
 'mid', 'edge_case', 'Contradictory signals - partial match expected'),

('Critical production outage URGENT',
 'URGENT: Production is down. All services offline. Cannot determine root cause. Everything is broken.',
 'unknown', 'edge_case', 'Panic report with no specifics - unknown'),

('Same as MAINT-15',
 'Experiencing the same issue as ticket MAINT-15 which was resolved last week.',
 'unknown', 'edge_case', 'References ticket ID not description - may not match'),

('Login timeout for one specific user',
 'Only user john.doe@company.com cannot login. Gets timeout error. All other users work fine.',
 'mid', 'edge_case', 'Matches login timeout pattern but scope is single user'),

('False alarm - resolved itself',
 'We had a payment 500 error for about 5 minutes but it resolved on its own before we could investigate.',
 'known', 'edge_case', 'Matches known pattern even though self-resolved'),

('New feature not working as expected',
 'The new bulk export feature we deployed yesterday is not working. It seems to hang after processing 1000 rows.',
 'unknown', 'edge_case', 'New feature issue - unlikely to be in KB');
