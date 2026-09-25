export interface DemoStep { route: string; title: string; text: string; tour?: string; setup?: 'mexico' | 'reset-scenario' }
export const DEMO_STEPS: DemoStep[] = [
  { route: '/', title: 'The problem and the personas', text: 'Mid-market CFOs rebuild the cash forecast in spreadsheets and see FX hits after the fact. FlowCast serves three people: Priya (CFO), Dev (developer) and Elena (advisor).', tour: 'journeys' },
  { route: '/app', title: 'The AI brief and its sources', text: 'An autonomous morning brief built from live state. Every claim carries a source chip; click one to see the actual line items. Click any week on the runway chart to open its drawer.', tour: 'brief' },
  { route: '/app/ask?q=What%20if%20EUR%20weakens%205%25%3F', title: 'Ask: what if EUR weakens 5%?', text: 'The engine re-runs the forecast; the AI only explains. Notice the thinking steps, source chips, confidence and the action button.', tour: 'ask-thread' },
  { route: '/app/scenarios', title: 'Mexico expansion breaches policy', text: 'The $3.5M capex in W7 takes the low below the $12M floor. Move the capex week to W11 and the banner turns green.', tour: 'breach-banner', setup: 'mexico' },
  { route: '/app/fx', title: 'Approve REC-2: policy routes it to an expert', text: 'Net first, hedge second. The EUR forward is at or above the $500K threshold, so "Approve" opens the Escalate modal. Add a note and send it.', tour: 'approve-REC-2' },
  { route: '/advisor', title: 'Elena responds', text: 'The escalation arrives with the full context package. Choose "Modify", set the ratio to 55%, add a rationale and submit.', tour: 'advisor-response' },
  { route: '/app/approvals', title: 'The result is back: approve it', text: 'REC-2 is back in "Needs my approval" with the expert’s note and 55% ratio. Approve it. Execution still needs a licensed partner.', tour: 'approvals-list' },
  { route: '/dev/start', title: 'Developer: sandbox and first call', text: 'Dev signs in, provisions a sandbox company clone and makes a first API call in minutes.', tour: 'first-call' },
  { route: '/dev/build', title: 'Certification evals: 47/50 to 50/50', text: 'Run evals, inspect the three failures, apply the suggested fixes and run again.', tour: 'evals' },
  { route: '/dev/publish', title: 'Go live, then see it as a customer', text: 'Complete the listing, submit and watch the review timeline. When live, click "See it as a customer" and install RevForecast.', tour: 'publish-submit' },
];
