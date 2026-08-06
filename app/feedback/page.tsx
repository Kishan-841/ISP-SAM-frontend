import { getFeedbackForm, type FeedbackForm } from '../../services/feedback';
import { FeedbackForm as FeedbackFormClient } from '../../components/feedback-form';

export const metadata = {
  title: 'Customer Feedback — Gazon Communication',
  description: 'Share your feedback on Gazon Communication services.',
};

export default async function FeedbackPage() {
  let form: FeedbackForm | null = null;
  try {
    form = await getFeedbackForm();
  } catch {
    form = null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-brand-700 font-semibold tracking-tight">
            <span className="text-lg">Gazon Communication</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Customer Feedback &amp; Service Assessment
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-xl mx-auto">
            Thank you for choosing Gazon Communication. Your feedback helps us improve our services
            and better understand your business needs. This survey takes about 5 minutes.
          </p>
        </header>

        {form ? (
          <FeedbackFormClient form={form} />
        ) : (
          <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-8 text-center">
            <p className="text-sm font-medium text-gray-700">
              This feedback form isn&apos;t available right now.
            </p>
            <p className="text-xs text-gray-500 mt-1">Please try again in a little while.</p>
          </div>
        )}
      </div>
    </div>
  );
}
