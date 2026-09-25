import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Forecast } from '../lib/forecast';
import { usdM, weekDate } from '../lib/format';

export const EVENTS: Record<number, string> = { 6: 'UK payroll + VAT', 7: 'US payroll + AP run', 9: 'MX prepayment', 11: 'Maison Nord €4.8M' };

export function RunwayChart({ f, compare, minCash, onWeek, height = 300, mini, showEvents = true }: { f: Forecast; compare?: Forecast; minCash: number; onWeek?: (w: number) => void; height?: number; mini?: boolean; showEvents?: boolean }) {
  const data = f.weeks.map((p, i) => ({
    week: `W${p.week}`, w: p.week, closing: p.closing / 1e6, band: [p.p10 / 1e6, p.p90 / 1e6], inflows: p.inflows, outflows: p.outflows,
    compare: compare ? compare.weeks[i].closing / 1e6 : undefined,
  }));
  const all = data.flatMap((d) => [d.band[0], d.band[1], d.compare ?? d.closing, minCash / 1e6]);
  const lo = Math.floor(Math.min(...all) - 1), hi = Math.ceil(Math.max(...all) + 1);
  return (
    <div style={{ height }} className="w-full select-none">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 12, left: mini ? 4 : 0, bottom: 0 }}
          onClick={(e: { activePayload?: { payload: { w: number } }[] }) => { const w = e?.activePayload?.[0]?.payload.w; if (w && onWeek) onWeek(w); }}
          style={{ cursor: onWeek ? 'pointer' : 'default' }}>
          <CartesianGrid stroke="var(--rule)" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--muted)' }} axisLine={{ stroke: 'var(--rule)' }} tickLine={false} />
          <YAxis domain={[lo, hi]} tick={{ fontSize: 12, fill: 'var(--muted)' }} tickFormatter={(v) => `$${v}M`} axisLine={false} tickLine={false} width={mini ? 50 : 56} />
          {!mini && (
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as typeof data[number];
              return (
                <div className="rounded-ctl border border-rule bg-surface px-3 py-2 text-xs text-[var(--text)] shadow-md">
                  <div className="mb-1 font-semibold">{d.week} · week of {weekDate(d.w)}</div>
                  <div className="text-cash">Inflows +{usdM(d.inflows, 2)}</div>
                  <div className="text-risk">Outflows {usdM(d.outflows, 2)}</div>
                  <div className="font-semibold">Closing {usdM(d.closing * 1e6, 2)}</div>
                  {d.compare !== undefined && <div className="text-ai">Scenario {usdM(d.compare * 1e6, 2)}</div>}
                  <div className="text-muted">P10–P90 {usdM(d.band[0] * 1e6)} – {usdM(d.band[1] * 1e6)}</div>
                  {onWeek && <div className="mt-1 text-action">Click to open week detail</div>}
                </div>
              );
            }} />
          )}
          <Area dataKey="band" stroke="none" fill="var(--action)" fillOpacity={0.12} isAnimationActive={!mini} name="P10–P90" />
          <ReferenceLine y={minCash / 1e6} stroke="var(--risk)" strokeDasharray="5 4" label={mini ? undefined : { value: `Policy floor ${usdM(minCash, 0)}`, position: 'insideBottomLeft', fill: 'var(--risk)', fontSize: 11 }} />
          <Line dataKey="closing" stroke="var(--ink)" strokeWidth={2.5} dot={{ r: mini ? 0 : 3, fill: 'var(--ink)' }} activeDot={{ r: 6 }} isAnimationActive name="Base" />
          {compare && <Line dataKey="compare" stroke="var(--ai)" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 3, fill: 'var(--ai)' }} isAnimationActive animationDuration={400} name="Scenario" />}
          {showEvents && !mini && Object.entries(EVENTS).map(([w, label]) => {
            const p = (compare ?? f).weeks[Number(w) - 1];
            return <ReferenceDot key={w} x={`W${w}`} y={p.closing / 1e6} r={0} label={{ value: label, position: Number(w) === 7 ? 'bottom' : 'top', fontSize: 10, fill: 'var(--muted)' }} />;
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Sparkline({ values, negativeBelow = 0 }: { values: number[]; negativeBelow?: number }) {
  const w = 110, h = 28;
  const min = Math.min(...values, negativeBelow), max = Math.max(...values);
  const x = (i: number) => (i / (values.length - 1)) * w;
  const y = (v: number) => h - ((v - min) / (max - min || 1)) * h;
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {min < 0 && <line x1={0} x2={w} y1={y(0)} y2={y(0)} stroke="var(--risk)" strokeDasharray="2 2" />}
      <polyline points={pts} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
    </svg>
  );
}
