// Public Privacy Policy / Terms page — linked from the login screen and
// required by Google's OAuth consent screen for apps requesting Gmail scopes.
// Review with your own details before launch: CONTACT_EMAIL and EFFECTIVE_DATE
// in particular, and anything below that stops matching what the app does.

import type { ReactNode } from "react";

const CONTACT_EMAIL = "24bce268@nirmauni.ac.in";
const EFFECTIVE_DATE = "October 2, 2026";

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-[10px]">
      <h2 className="font-semibold text-[20px] text-black leading-[28px]">{title}</h2>
      <div className="flex flex-col gap-[10px] text-[15px] leading-[24px] text-[#374151]">{children}</div>
    </section>
  );
}

function Privacy() {
  return (
    <>
      <Section title="What MailSense accesses">
        <p>When you sign in with Google you grant MailSense:</p>
        <ul className="list-disc pl-[22px]">
          <li><strong>Gmail (read-only)</strong> — to import messages in your inbox: sender, recipient, subject, plain-text body and received time. MailSense cannot send, delete or modify your mail.</li>
          <li><strong>Google Calendar events</strong> — to list your upcoming events and to add or remove a deadline event, only when you click "Add event" on an email.</li>
          <li><strong>Your email address and profile picture</strong> — to identify your account.</li>
        </ul>
      </Section>

      <Section title="What we store and why">
        <ul className="list-disc pl-[22px]">
          <li>Copies of your recent inbox messages (initially up to the last 30 days), so you can browse, search and categorize them.</li>
          <li>Numeric embeddings (vector representations) of those messages, used for semantic search and for auto-categorization into categories you create.</li>
          <li>Your AI chat conversations, so you can return to them.</li>
          <li>Your Google access tokens, encrypted at rest (AES-256-GCM), so mail keeps syncing while you're away.</li>
        </ul>
      </Section>

      <Section title="Third parties that process your data">
        <ul className="list-disc pl-[22px]">
          <li><strong>Google Gemini API</strong> — when you ask the AI assistant a question, the most relevant emails are sent to Gemini to generate the answer. Gemini may also receive short email snippets and category summaries when auto-categorization is unsure.</li>
          <li><strong>Google Gmail, Calendar and Pub/Sub APIs</strong> — to read mail, manage calendar events and receive new-mail notifications.</li>
        </ul>
        <p>We do not sell your data, use it for advertising, or share it with anyone else.</p>
      </Section>

      <Section title="Google API Services — Limited Use">
        <p>
          MailSense's use and transfer of information received from Google APIs adheres to the{" "}
          <a className="underline" href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. Gmail data is used only to provide the features you see in the app.
          It is not used to train general-purpose AI models, and humans do not read it except with your explicit consent,
          for security purposes, or where required by law.
        </p>
      </Section>

      <Section id="security" title="Security">
        <p>
          Sessions use httpOnly cookies. Google tokens are encrypted at rest, and internal services only accept requests
          from the MailSense backend. No system is perfectly secure; please report any issue to {CONTACT_EMAIL}.
        </p>
      </Section>

      <Section title="Retention and deletion">
        <p>
          We keep your data until you delete your account. Use <strong>Profile → Delete account</strong> to revoke
          MailSense's Google access and permanently delete your stored emails, embeddings, categories and chats. Calendar
          events you added remain in your Google Calendar. You can also revoke access at any time from your{" "}
          <a className="underline" href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">Google Account permissions</a>.
        </p>
      </Section>
    </>
  );
}

function Terms() {
  return (
    <>
      <Section title="The service">
        <p>
          MailSense is a student project that adds search, AI question-answering and categorization on top of your Gmail
          inbox. It is provided "as is", without warranties of any kind, and may change or be discontinued.
        </p>
      </Section>
      <Section title="AI-generated content">
        <p>
          AI answers, detected deadlines and automatic categories can be wrong. Check important information against the
          original email before acting on it.
        </p>
      </Section>
      <Section title="Acceptable use">
        <p>Only connect a Google account you own or are authorized to use. Don't attempt to access other users' data or disrupt the service.</p>
      </Section>
      <Section title="Your data">
        <p>How your data is handled is described in the Privacy Policy below. You can delete your account at any time from your profile.</p>
      </Section>
      <Section title="Limitation of liability">
        <p>To the extent permitted by law, the MailSense team is not liable for missed emails, missed deadlines or any loss arising from use of the service.</p>
      </Section>
    </>
  );
}

export default function LegalPage({ page }: { page: "privacy" | "terms" }) {
  return (
    <div className="w-full min-h-screen bg-white font-['Inter',sans-serif]">
      <main className="max-w-[760px] mx-auto px-[16px] py-[48px] flex flex-col gap-[32px]">
        <header className="flex flex-col gap-[8px]">
          <a href="/" className="text-[13px] text-[#6b7280] hover:text-black">← MailSense</a>
          <h1 className="font-semibold text-[36px] text-black tracking-[-0.9px] leading-[40px]">
            {page === "privacy" ? "Privacy Policy" : "Terms of Service"}
          </h1>
          <p className="text-[13px] text-[#6b7280]">Effective {EFFECTIVE_DATE} · Questions: <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
          <nav className="flex gap-[16px] text-[14px]">
            <a href="/privacy" className={page === "privacy" ? "text-black font-semibold" : "text-[#6b7280] hover:text-black"}>Privacy</a>
            <a href="/terms" className={page === "terms" ? "text-black font-semibold" : "text-[#6b7280] hover:text-black"}>Terms</a>
          </nav>
        </header>
        {page === "privacy" ? <Privacy /> : (<><Terms /><h2 className="font-semibold text-[28px] text-black pt-[16px]">Privacy Policy</h2><Privacy /></>)}
      </main>
    </div>
  );
}
