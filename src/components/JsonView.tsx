import { useState } from 'react';
import { Button, copyText } from './ui';

export function JsonView({ value, status, action = 'I-05' }: { value: unknown; status?: number; action?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const text = JSON.stringify(value, null, 2);
  return (
    <div className="rounded-ctl border border-rule bg-[#0A1626]">
      <div className="flex items-center gap-2 border-b border-[#22405F] px-3 py-1.5 text-xs text-[#9FB2C6]">
        {status !== undefined && <span className={`rounded px-1.5 py-0.5 font-mono font-semibold ${status < 300 ? 'bg-[#0F8A5F]/30 text-[#5BD6A5]' : 'bg-[#C2410C]/30 text-[#FF9B73]'}`}>{status}</span>}
        <span>application/json</span>
        <button type="button" className="ml-auto underline" onClick={() => setCollapsed(!collapsed)}>{collapsed ? 'Expand' : 'Collapse'}</button>
        <Button size="sm" variant="ghost" action={action} onClick={() => copyText(text, 'JSON copied')}>Copy JSON</Button>
      </div>
      {!collapsed && <pre className="max-h-96 overflow-auto p-3 font-mono text-xs leading-relaxed text-[#E6EDF5]">{text}</pre>}
    </div>
  );
}

export function Code({ code, onCopy, action }: { code: string; onCopy?: string; action?: string }) {
  return (
    <div className="relative rounded-ctl border border-rule bg-[#0A1626]">
      <Button size="sm" variant="ghost" action={action} className="absolute right-1 top-1" onClick={() => copyText(code, onCopy ?? 'Code copied')}>Copy</Button>
      <pre className="overflow-auto p-3 pr-16 font-mono text-xs leading-relaxed text-[#E6EDF5]">{code}</pre>
    </div>
  );
}
