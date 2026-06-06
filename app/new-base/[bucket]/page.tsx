import { notFound } from 'next/navigation';
import { PageHeader } from '../../../components/page-header';
import { BucketChangesView } from '../../../components/bucket-changes-view';
import { getCookieHeader } from '../../../lib/get-cookie-header';
import { getBucketChanges } from '../../../services/dashboard';
import { BUCKET_LABEL, BUCKET_SUBTITLE, bucketFromSlug } from '../../../lib/bucket';

export default async function NewBaseBucketPage({
  params,
}: {
  params: Promise<{ bucket: string }>;
}) {
  const { bucket: slug } = await params;
  const bucket = bucketFromSlug(slug);
  if (!bucket) notFound();

  const cookieHeader = await getCookieHeader();
  const { changes } = await getBucketChanges(
    { kittyType: 'NEW', bucket },
    { cookieHeader },
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl flex flex-col gap-4">
      <PageHeader
        title={BUCKET_LABEL[bucket]}
        subtitle={`New Base · All time · ${changes.length} ${
          changes.length === 1 ? 'change' : 'changes'
        } · ${BUCKET_SUBTITLE[bucket]}`}
      />
      <BucketChangesView
        rows={changes}
        bucket={bucket}
        backHref="/new-base"
        backLabel="New Base"
      />
    </div>
  );
}
