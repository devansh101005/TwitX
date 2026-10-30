import { MarketingHeader } from '@/components/MarketingHeader';
import { Footer } from '@/components/Footer';

export const metadata = {
  title: 'Privacy — Copilot',
};

const SECTIONS = [
  {
    label: 'What we store',
    body: [
      'Your account — name and email, handled by our auth provider when you sign in with Google.',
      'Your settings — niches, tone, posting style, and any tweet samples you paste in to shape your voice.',
      'Your drafts — the tweets the copilot generates, plus your approve / skip / edit feedback on them.',
      'Source material — the trending posts pulled from Reddit, Hacker News, and GitHub that a draft was based on.',
    ],
  },
  {
    label: 'Who processes it',
    body: [
      'Clerk — authentication and your account profile.',
      'Supabase — the database where your settings and drafts live.',
      'PhanRouter / the configured AI model — receives the prompt (your settings + trending sources) to write drafts.',
      'Telegram — only if you connect it, to deliver drafts to your chat.',
    ],
  },
  {
    label: 'What we never do',
    body: [
      'Never post to your Twitter/X account. Every draft is reviewed and posted by you, by hand.',
      'Never sell or share your data with advertisers.',
      'Never read or store your Twitter credentials — the app has no Twitter login.',
    ],
  },
  {
    label: 'Your control',
    body: [
      'Disconnect Telegram any time from the Channels page, or by sending /stop to the bot.',
      'Change or clear your settings and voice samples whenever you want.',
      'Ask to delete your account and we remove your stored data.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex-1 flex flex-col">
      <MarketingHeader />

      <main className="flex-1 px-6 md:px-12 lg:px-16 py-16 md:py-24 max-w-2xl w-full mx-auto">
        <header className="mb-14 reveal">
          <p className="eyebrow mb-3">Privacy</p>
          <h1 className="text-[40px] md:text-[52px] leading-[0.95] tracking-[-0.035em] font-medium">
            What we keep, and why.
          </h1>
          <p className="mt-4 text-ink-3 leading-relaxed max-w-md">
            Copilot is a drafting assistant. It needs enough about you to write
            in your voice — nothing more. Here&apos;s the whole picture.
          </p>
        </header>

        <div className="space-y-12">
          {SECTIONS.map((s) => (
            <section key={s.label} className="reveal">
              <p className="eyebrow mb-4">{s.label}</p>
              <ul className="space-y-3">
                {s.body.map((line, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                    <span className="font-mono text-ink-4 mt-1 shrink-0">—</span>
                    <span className="text-ink-2">{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-14 pt-6 border-t border-line font-mono text-[10px] text-ink-4 leading-relaxed">
          This is a small, personal project. Questions about your data — reach
          out to the operator listed on the repository.
        </p>
      </main>

      <Footer />
    </div>
  );
}
