import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Icon from '../components/Shared/Icon.jsx'
import NovaLogo from '../components/Shared/NovaLogo.jsx'

export default function TermsPage() {
  const navigate = useNavigate()
  const [showTopBtn, setShowTopBtn] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 160)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen antialiased">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-xl shadow-sm border-b border-surface-container-low pt-safe">
        <div className="h-16 px-4 flex items-center justify-between max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3 min-w-0">
            <button
              aria-label="Go Back"
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors flex-shrink-0"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/chats'))}
            >
              <Icon name="arrow_back" className="text-[20px]" />
            </button>
            <NovaLogo size={28} />
            <div className="flex flex-col min-w-0">
              <h1 className="text-[16px] font-semibold text-on-surface truncate leading-snug">Terms of Service</h1>
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">NovaChat Legal</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary text-[12px] font-medium shadow-sm flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            v2.4
          </span>
        </div>
      </header>

      {/* Main Content Feed */}
      <main className="flex-1 flex flex-col w-full max-w-2xl mx-auto px-4 pt-4 pb-16">
        <div className="flex flex-col gap-6">
          {/* Document Meta Hero Banner */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-low flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[12px] text-on-surface-variant flex items-center gap-1.5">
                <Icon name="schedule" className="text-[16px] text-outline" />
                Last updated: October 2024
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-semibold">
                Legal Agreement • v2.4
              </span>
            </div>
            <p className="text-[14px] text-on-surface-variant leading-relaxed">
              Welcome to NovaChat. By accessing or using our application, messaging features, or services, you agree to comply with these Terms of Service.
            </p>

            {/* Trust Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-surface-container-low p-3 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary flex-shrink-0">
                  <Icon name="verified_user" className="text-[18px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-semibold text-on-surface truncate">User Accounts</span>
                  <span className="text-[10px] text-on-surface-variant">Email & Username Auth</span>
                </div>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary flex-shrink-0">
                  <Icon name="lock" className="text-[18px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-semibold text-on-surface truncate">Protected Access</span>
                  <span className="text-[10px] text-on-surface-variant">Postgres RLS Policies</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Acceptable Use */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-low flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                <Icon name="shield_person" className="text-[20px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-primary font-semibold uppercase tracking-wide">Section 01</span>
                <h2 className="text-[16px] font-semibold text-on-surface">Acceptable Use Policy</h2>
              </div>
            </div>
            <p className="text-[14px] text-on-surface-variant leading-relaxed">
              NovaChat is engineered for authentic human communication. To ensure safe and uninterrupted messaging across the network, you agree not to:
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low">
                <Icon name="block" className="text-[18px] text-tertiary mt-0.5 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-on-surface">Automated Abuse & Spam</span>
                  <span className="text-[14px] text-on-surface-variant">Distribute unsolicited promotions, deployment of automated scraping bots, or spam messages.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low">
                <Icon name="speed" className="text-[18px] text-tertiary mt-0.5 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-on-surface">Rate Limit Compliance</span>
                  <span className="text-[14px] text-on-surface-variant">Intentionally flood endpoints or exceed standard API rate limits designed to maintain backend stability.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low">
                <Icon name="gavel" className="text-[18px] text-tertiary mt-0.5 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-on-surface">Harassment & Harm</span>
                  <span className="text-[14px] text-on-surface-variant">Engage in hate speech, exploitation, non-consensual media sharing, or targeted intimidation.</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Account Safeguards */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-low flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                <Icon name="phonelink_lock" className="text-[20px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-primary font-semibold uppercase tracking-wide">Section 02</span>
                <h2 className="text-[16px] font-semibold text-on-surface">Account Safeguards</h2>
              </div>
            </div>
            <p className="text-[14px] text-on-surface-variant leading-relaxed">
              Your NovaChat account is authenticated via your registered email and username credentials. You are responsible for keeping your credentials confidential.
            </p>
            <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-1 border border-surface-container">
              <div className="flex items-center gap-2 text-on-surface font-medium text-[14px]">
                <Icon name="key" className="text-[18px] text-primary" />
                <span>Password Security</span>
              </div>
              <p className="text-[14px] text-on-surface-variant leading-relaxed">
                Ensure you use a strong, unique password. If you lose access to your email account or password, follow the account recovery procedures.
              </p>
            </div>
          </section>

          {/* Section 3: Content Ownership */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-low flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                <Icon name="copyright" className="text-[20px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-primary font-semibold uppercase tracking-wide">Section 03</span>
                <h2 className="text-[16px] font-semibold text-on-surface">Content Ownership & Rights</h2>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-primary text-on-primary shadow-sm flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon name="verified" className="text-[20px] text-on-primary" />
                <h3 className="text-[16px] font-semibold text-on-primary">Your Content Remains Yours</h3>
              </div>
              <p className="text-[14px] text-on-primary-container leading-relaxed">
                NovaChat asserts zero intellectual property claims or commercial ownership rights over files, photos, voice notes, or text messages transmitted through the application.
              </p>
            </div>
          </section>

          {/* Section 4: Termination & Exit */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-low flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                <Icon name="person_off" className="text-[20px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-primary font-semibold uppercase tracking-wide">Section 04</span>
                <h2 className="text-[16px] font-semibold text-on-surface">Termination & Exit</h2>
              </div>
            </div>
            <p className="text-[14px] text-on-surface-variant leading-relaxed">
              You may stop using NovaChat at any time. Account deletion requests can be submitted by contacting support.
            </p>
          </section>

          {/* Section 5: Limitation of Liability */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-low flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                <Icon name="balance" className="text-[20px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-primary font-semibold uppercase tracking-wide">Section 05</span>
                <h2 className="text-[16px] font-semibold text-on-surface">Limitation of Liability</h2>
              </div>
            </div>
            <p className="text-[14px] text-on-surface-variant leading-relaxed">
              NovaChat is provided on an "AS IS" and "AS AVAILABLE" basis without express warranties regarding continuous availability during network disruptions.
            </p>
          </section>

          {/* Section 6: Governing Law */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-low flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                <Icon name="public" className="text-[20px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-primary font-semibold uppercase tracking-wide">Section 06</span>
                <h2 className="text-[16px] font-semibold text-on-surface">Governing Law</h2>
              </div>
            </div>
            <p className="text-[14px] text-on-surface-variant leading-relaxed font-mono text-[13px] bg-surface-container-low p-3 rounded-xl border border-surface-container">
              Governing Law: [TO BE SPECIFIED — consult a lawyer for your jurisdiction]
            </p>
          </section>

          {/* Section 7: Legal Inquiries */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-low flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-primary flex-shrink-0">
                <Icon name="contact_support" className="text-[20px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="text-[16px] font-semibold text-on-surface">Questions or Legal Inquiries?</h2>
                <span className="text-[11px] text-on-surface-variant">Contact NovaChat Support</span>
              </div>
            </div>
            <a
              className="w-full flex items-center justify-between p-4 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm"
              href="mailto:legal@novachat.app"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon name="mail" className="text-[20px] text-on-primary flex-shrink-0" />
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-[11px] text-on-primary/80 font-medium">Legal Support</span>
                  <span className="text-[14px] font-medium text-on-primary truncate">legal@novachat.app</span>
                </div>
              </div>
              <Icon name="arrow_forward" className="text-[20px] text-on-primary flex-shrink-0" />
            </a>
          </section>
        </div>

        {/* Back to Top Floating Button */}
        {showTopBtn && (
          <button
            aria-label="Back to top"
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-1.5 bg-primary text-on-primary text-[12px] font-semibold px-4 py-2.5 rounded-full shadow-lg hover:opacity-95 active:scale-95 transition-all duration-200"
          >
            <Icon name="arrow_upward" className="text-[18px]" />
            <span>Top</span>
          </button>
        )}

        {/* Footer */}
        <footer className="w-full mt-12 py-6 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="text-[12px] font-medium">NovaChat Inc.</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <Link to="/privacy" className="text-[12px] font-medium hover:underline">Privacy Policy</Link>
          </div>
        </footer>
      </main>
    </div>
  )
}
