import { useMemo } from 'react';
import { useApp } from './useApp';
import { computeAll, type CustomerCore, type Rec } from '../lib/derive';
import { toast } from '../components/toast';
import { useUI } from './ui';

export function useCore(): CustomerCore {
  const c = useApp((s) => s.customer);
  return c;
}
export function useComputed() {
  const c = useCore();
  return useMemo(() => computeAll(c), [c.scenario, c.recs, c.autonomy, c.policy, c.installedAgents, c.revokedScopes, c.revforecastLive]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useRecActions() {
  const setRec = useApp((s) => s.setRec);
  const log = useApp((s) => s.log);
  const setUI = useUI((s) => s.set);
  const approve = (rec: Rec) => {
    if (rec.policy.route === 'expert') { setUI({ escalateRecId: rec.id }); toast('Policy requires an expert review first. Add a note to escalate.', 'info'); return false; }
    if (rec.policy.route === 'blocked') { toast('This action is turned off in the Trust Center. Change its autonomy tier to use it.', 'error'); return false; }
    const prev = { ...rec.state };
    setRec(rec.id, { status: 'approved' });
    log('user', rec.policy.route === 'auto' ? 'auto' : 'approve', `${rec.toast}: ${rec.id} · ${rec.title}`, rec.sources, rec.id);
    toast(`${rec.toast}${rec.id === 'REC-1' ? '. Forecast recalculated.' : '.'}`, 'success', () => { setRec(rec.id, prev); log('user', 'approve', `Undid approval of ${rec.id}`, [], rec.id); });
    return true;
  };
  const dismiss = (rec: Rec, reason: string) => {
    const prev = { ...rec.state };
    setRec(rec.id, { status: 'dismissed', dismissReason: reason });
    log('user', 'approve', `Dismissed ${rec.id}: ${reason}`, rec.sources, rec.id);
    toast('Recommendation dismissed', 'success', () => setRec(rec.id, prev));
  };
  return { approve, dismiss };
}
