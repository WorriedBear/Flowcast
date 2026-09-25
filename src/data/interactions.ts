/**
 * Interaction inventory for kept pages only (Part 0-A). `initial: true` means the element
 * is present on first render of the page from the seed state; others appear after a prior step.
 */
export interface Interaction { id: string; route: string; element: string; initial: boolean }
const I = (route: string, initial: boolean, ...rows: [string, string][]) => rows.map(([id, element]) => ({ id, route, element, initial }));

export const INTERACTIONS: Interaction[] = [
  ...I('/', true, ['L-01', 'Start guided demo'], ['L-02', 'Run finance as Priya'], ['L-03', 'Build as Dev'], ['L-04', 'Advise as Elena'], ['L-05', 'Why IES: pillars'], ['L-06', 'Why IES: moat'], ['L-07', 'Why IES: operating model'], ['L-08', 'Why IES: platform'], ['L-09', 'Stat source links']),
  ...I('/app', true, ['C-01', 'Source chip'], ['C-02', 'KPI tiles'], ['C-03', 'Chart week click'], ['C-04', 'Entity row click'], ['C-05', 'Recommendation Approve'], ['C-06', 'Recommendation Why?'], ['C-07', 'Recommendation Dismiss'], ['C-08', 'View all approvals'], ['C-09', 'Brief Regenerate']),
  ...I('/app/ask', true, ['A-01', 'Send'], ['A-02', 'Suggested chip']),
  ...I('/app/ask', false, ['A-03', 'Answer action buttons'], ['A-04', 'Source chip in answer'], ['A-05', 'Clear conversation'], ['A-06', 'Copy answer']),
  ...I('/app/scenarios', true, ['S-01', 'Sliders / inputs'], ['S-02', 'Presets'], ['S-03', 'Reset to base'], ['S-09', 'Critique'], ['S-10', 'Send to Ask']),
  ...I('/app/fx', true, ['X-01', 'Expand row'], ['X-02', 'Approve hedge'], ['X-03', 'Escalate'], ['X-04', 'Adjust'], ['X-07', 'Edit policy']),
  ...I('/app/fx', false, ['X-05', 'Execute via partner'], ['X-06', 'Install partner link']),
  ...I('/app/approvals', true, ['P-01', 'Tab switch'], ['P-02', 'Row expand'], ['P-03', 'Approve (C-05 on rows)'], ['P-04', 'Dismiss (C-07 on rows)'], ['P-05', 'Escalate'], ['P-06', 'Bulk select'], ['P-07', 'Bulk approve']),
  ...I('/app/approvals', false, ['P-08', 'Undo (toast)']),
  ...I('/app/marketplace', true, ['M-01', 'Search'], ['M-02', 'Filters'], ['M-03', 'Sort'], ['M-04', 'Card click']),
  ...I('/app/marketplace/hedgeloop', true, ['M-05', 'Install']),
  ...I('/app/marketplace/hedgeloop', false, ['M-06', 'Consent checkboxes'], ['M-07', 'Confirm install']),
  ...I('/app/marketplace/shipsignal', true, ['M-08', 'Uninstall'], ['M-09', 'Manage access']),
  ...I('/app/trust', true, ['T-01', 'Tier control'], ['T-02', 'Policy save'], ['T-03', 'Scope toggle'], ['T-04', 'Log filters']),
  ...I('/dev', true, ['D-01', 'Journey steps'], ['D-02', 'Start building'], ['D-03', 'Explore the API']),
  ...I('/dev/start', true, ['O-01', 'Stepper next/back']),
  ...I('/dev/start', false, ['O-02', 'Provision'], ['O-03', 'Reveal key'], ['O-04', 'Copy key'], ['O-05', 'Code tab'], ['O-06', 'Run first call']),
  ...I('/dev/api', true, ['I-01', 'Endpoint nav'], ['I-06', 'Copy MCP config']),
  ...I('/dev/api/forecast', true, ['I-02', 'Params inputs'], ['I-03', 'Scope selector'], ['I-04', 'Send']),
  ...I('/dev/api/forecast', false, ['I-05', 'Copy JSON']),
  ...I('/dev/build', true, ['B-01', 'Validate'], ['B-02', 'Side-form controls'], ['B-03', 'Run in sandbox'], ['B-04', 'Run evals'], ['B-07', 'Reset manifest']),
  ...I('/dev/build', false, ['B-05', 'View trace'], ['B-06', 'Apply fixes']),
  ...I('/dev/publish', true, ['U-01', 'Form fields'], ['U-02', 'Checklist links'], ['U-03', 'Submit']),
  ...I('/dev/publish', false, ['U-04', 'See as customer'], ['U-05', 'Unpublish']),
  ...I('/advisor', true, ['V-01', 'Queue item'], ['V-02', 'Response form'], ['V-03', 'Submit'], ['V-04', 'Resolved tab']),
  ...I('/advisor', false, ['V-05', 'Switch to CFO to see result']),
];

export const KEPT_ROUTES = ['/', '/app', '/app/ask', '/app/scenarios', '/app/fx', '/app/approvals', '/app/marketplace', '/app/marketplace/:agentId', '/app/trust', '/dev', '/dev/start', '/dev/api', '/dev/api/:endpointId', '/dev/build', '/dev/publish', '/advisor', '/strategy', '/research', '/ai-process', '/about'];
