import { PageHeader } from '../components/page-header';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="px-8 py-6 max-w-7xl">
      <PageHeader title="Home" subtitle="Welcome back" />
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-sm text-gray-500">
        Use the sidebar to navigate. The Existing Base Dashboard is a good place to start.
      </div>
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-3">Buttons preview:</div>
        <div className="flex items-center gap-3">
          <Button>shadcn primary</Button>
          <Button variant="outline">shadcn outline</Button>
        </div>
      </div>
    </div>
  );
}
