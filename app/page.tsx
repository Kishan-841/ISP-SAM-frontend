import { PageHeader } from '../components/page-header';

export default function HomePage() {
  return (
    <div className="px-8 py-6 max-w-7xl">
      <PageHeader title="Home" subtitle="Welcome back" />
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-sm text-gray-500">
        Use the sidebar to navigate. The Existing Base Dashboard is a good place to start.
      </div>
    </div>
  );
}
