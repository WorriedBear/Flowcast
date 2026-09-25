import { Ext, usePageTitle } from '../components/ui';
import { BUILDER, DECK_URL, PROTOTYPE_URL, REPO_URL, VIDEO_URL } from '../config';

export default function About() {
  usePageTitle('About the builder', 'Who built FlowCast and why.');
  const links = [['Prototype', PROTOTYPE_URL], ['Deck', DECK_URL], ['Video', VIDEO_URL], ['Source code', REPO_URL]].filter(([, u]) => u);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="panel flex flex-col gap-5 p-6 sm:flex-row">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-ink text-2xl font-semibold text-[var(--paper)]">{BUILDER.initials}</div>
        <div>
          <h1 className="text-[28px] font-semibold text-ink">{BUILDER.name}</h1>
          <p className="mt-2 leading-relaxed">{BUILDER.bio}</p>
          {links.length > 0 && <ul className="mt-4 flex flex-wrap gap-4 text-sm">{links.map(([l, u]) => <li key={l}><Ext href={u}>{l}</Ext></li>)}</ul>}
        </div>
      </div>
      <p className="mt-6 text-sm text-muted">FlowCast is a product-case prototype. Solace Living, Northbeam Labs, Harbor & Vale Advisory and all people shown are fictional. Intuit and Intuit Enterprise Suite are referenced by name only; no logos are used.</p>
    </div>
  );
}
