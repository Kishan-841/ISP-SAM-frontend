import { notFound } from 'next/navigation';
import { PageHeader } from '../../../components/page-header';
import { BucketChangesView } from '../../../components/bucket-changes-view';
import { getCookieHeader } from '../../../lib/get-cookie-header';
import { getBucketChanges, type FyQuarter } from '../../../services/dashboard';
import { BUCKET_LABEL, BUCKET_SUBTITLE, bucketFromSlug } from '../../../lib/bucket';

const QUARTERS: ReadonlySet<string> = new Set(['Q1', 'Q2', 'Q3', 'Q4']);

export default async function ExistingBaseBucketPage({
  params,
  searchParams,
}: {
  params: Promise<{ bucket: string }>;
  searchParams: Promise<{ quarter?: string }>;
}) {
  const { bucket: slug } = await params;
  const bucket = bucketFromSlug(slug);
  if (!bucket) notFound();

  const sp = await searchParams;
  const quarter = QUARTERS.has(sp.quarter ?? '') ? (sp.quarter as FyQuarter) : undefined;

  const cookieHeader = await getCookieHeader();
  const { changes } = await getBucketChanges(
    { kittyType: 'BASE', bucket, quarter },
    { cookieHeader },
  );

  const scope = quarter ?? 'FYTD';
  const backHref = quarter ? `/existing-base?quarter=${quarter}` : '/existing-base';

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl flex flex-col gap-4">
      <PageHeader
        title={BUCKET_LABEL[bucket]}
        subtitle={`Existing Base · ${scope} · ${changes.length} ${
          changes.length === 1 ? 'change' : 'changes'
        } · ${BUCKET_SUBTITLE[bucket]}`}
      />
      <BucketChangesView
        rows={changes}
        bucket={bucket}
        backHref={backHref}
        backLabel="Existing Base"
      />
    </div>
  );
}
