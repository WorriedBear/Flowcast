import { Link } from 'react-router-dom';
import { usePageTitle } from '../components/ui';

export default function NotFound({ inline }: { inline?: boolean }) {
  usePageTitle('Page not found', 'This page does not exist.');
  return (
    <div className={`mx-auto max-w-xl ${inline ? 'py-10' : 'px-4 py-20'} text-center`}>
      <div className="text-[40px] font-semibold text-ink">This page doesn&apos;t exist</div>
      <p className="mt-2 text-muted">The link may be old, or the item was unpublished. Pick a place to continue:</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/app" className="rounded-ctl bg-action px-4 py-2 text-sm font-medium text-white">CFO Command Center</Link>
        <Link to="/dev" className="rounded-ctl border border-rule bg-surface px-4 py-2 text-sm font-medium">Developer home</Link>
        <Link to="/advisor" className="rounded-ctl border border-rule bg-surface px-4 py-2 text-sm font-medium">Advisor workspace</Link>
      </div>
      <p className="mt-4 text-sm text-muted">Or start from the <Link to="/" className="link">story landing page</Link>.</p>
    </div>
  );
}
