import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-6">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="prose prose-invert prose-sm max-w-none text-foreground space-y-4">
          <p>
            SmartCal respects your privacy. This policy describes how we collect, use, and protect your information.
          </p>
          <h2 className="text-lg font-semibold mt-6">Information We Collect</h2>
          <p>
            When you create an account, we store your email address. Calendar data (assignments, course information) is stored to provide the service. We do not sell your data.
          </p>
          <h2 className="text-lg font-semibold mt-6">How We Use Your Data</h2>
          <p>
            Your data is used solely to deliver SmartCal features: calendar management, AI parsing, and task recommendations.
          </p>
          <h2 className="text-lg font-semibold mt-6">Data Security</h2>
          <p>
            We use industry-standard security practices. Authentication is handled by Supabase. Your calendar data is stored securely and accessible only to you.
          </p>
          <h2 className="text-lg font-semibold mt-6">Contact</h2>
          <p>
            For questions about this policy, please contact us through the website.
          </p>
        </div>
      </div>
    </div>
  );
}
