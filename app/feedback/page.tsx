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
    // Shims that take effect immediately, even if the backend catalog hasn't
    // redeployed yet:
    //  - Q6 "Service Manager Name" is covered by the "Your SAM" dropdown.
    //  - Rating scale hints (e.g. "5 = Excellent, 1 = Very Poor") are obvious.
    form = {
      ...form,
      questions: form.questions
        .filter((q) => q.id !== 'q6')
        .map((q) => (q.type === 'rating5' ? { ...q, help: undefined } : q)),
    };
  } catch {
    form = null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Gazon Communication
          </p>
          <h1 className="mt-2 text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
            Customer Feedback &amp; Service Assessment
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Takes about 5 minutes — your input directly shapes our service.
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
