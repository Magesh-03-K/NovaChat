import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Icon from '../components/Shared/Icon.jsx'
import NovaLogo from '../components/Shared/NovaLogo.jsx'

export default function PrivacyPolicyPage() {
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
              <h1 className="text-[16px] font-semibold text-on-surface truncate leading-snug">Privacy Policy</h1>
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">NovaChat Legal</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary text-[12px] font-medium shadow-sm flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            v3.4 Legal
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full max-w-2xl mx-auto px-4 pt-4 pb-16">
        <div className="flex flex-col gap-6">
          {/* Hero Context & Meta */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-on-surface-variant">Last updated: October 2024</span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                <span className="text-[11px] text-primary font-medium">v3.4 Legal</span>
              </div>
              <div className="inline-flex items-center gap-1 bg-surface-container-high text-primary px-3 py-1 rounded-full shadow-sm">
                <Icon name="verified_user" fill className="text-[15px]" />
                <span className="text-[11px] font-semibold tracking-wide">Data Protection</span>
              </div>
            </div>

            {/* Quick Overview Card */}
            <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-surface-container-low flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0 text-on-primary-fixed">
                  <Icon name="lock" className="text-[22px]" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[16px] font-semibold text-on-surface">Data Access & Protection</span>
                  <p className="text-[14px] text-on-surface-variant leading-relaxed">
                    NovaChat stores user messages in a secure Supabase PostgreSQL database protected by Row-Level Security (RLS). Only authenticated participants in a chat can access its contents through the application interface.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Structured Sections */}
          <div className="flex flex-col gap-6">
            {/* Section 1: What We Collect */}
            <article className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-low flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-secondary-fixed flex items-center justify-center text-[12px] font-bold text-on-secondary-fixed flex-shrink-0">
                  1
                </span>
                <h2 className="text-[20px] font-semibold text-on-surface">What We Collect</h2>
              </div>
              <p className="text-[14px] text-on-surface-variant leading-relaxed">
                We collect only the essential information necessary to provide, secure, and deliver your NovaChat messaging experience:
              </p>
              <ul className="flex flex-col gap-3 mt-1">
                <li className="flex items-start gap-3 bg-surface-container-low p-3 rounded-xl">
                  <Icon name="badge" className="text-primary text-[18px] mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-on-surface">Account Credentials</span>
                    <span className="text-[14px] text-on-surface-variant">Your email address, unique username, and encrypted password managed securely via Supabase Auth. No phone number is collected or required.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 bg-surface-container-low p-3 rounded-xl">
                  <Icon name="chat" className="text-primary text-[18px] mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-on-surface">Messages & Profile Data</span>
                    <span className="text-[14px] text-on-surface-variant">Chat messages, uploaded media attachments, and optional profile details (avatar photo, about text) stored in database storage.</span>
                  </div>
                </li>
              </ul>
            </article>

            {/* Section 2: How We Use It */}
            <article className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-low flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-secondary-fixed flex items-center justify-center text-[12px] font-bold text-on-secondary-fixed flex-shrink-0">
                  2
                </span>
                <h2 className="text-[20px] font-semibold text-on-surface">How We Use It</h2>
              </div>
              <p className="text-[14px] text-on-surface-variant leading-relaxed">
                Your information is used strictly to power core app features. We do not sell or rent your personal data to third parties or advertising networks:
              </p>
              <div className="grid grid-cols-1 gap-2 pt-1">
                <div className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                    <Icon name="swap_calls" className="text-[16px]" />
                  </div>
                  <p className="text-[14px] text-on-surface-variant">Delivering direct messages and group chat conversations to your authorized devices.</p>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                    <Icon name="notifications" className="text-[16px]" />
                  </div>
                  <p className="text-[14px] text-on-surface-variant">Sending Web Push notification alerts for new incoming messages when enabled.</p>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                    <Icon name="security" className="text-[16px]" />
                  </div>
                  <p className="text-[14px] text-on-surface-variant">Enforcing account authentication and protecting against unauthorized access.</p>
                </div>
              </div>
            </article>

            {/* Section 3: Data Storage & Security */}
            <article className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-low flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-secondary-fixed flex items-center justify-center text-[12px] font-bold text-on-secondary-fixed flex-shrink-0">
                  3
                </span>
                <h2 className="text-[20px] font-semibold text-on-surface">Data Storage & Security</h2>
              </div>
              <p className="text-[14px] text-on-surface-variant leading-relaxed">
                Messages and uploaded media are stored in a managed PostgreSQL database and file storage buckets provided by Supabase.
              </p>
              <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2 border border-surface-container">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-on-surface">Row-Level Security (RLS)</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary text-on-primary font-bold">PostgreSQL RLS</span>
                </div>
                <p className="text-[14px] text-on-surface-variant leading-relaxed">
                  Database access policies enforce that message content is only readable by authorized chat members through application queries. Note that message content is stored on the database server and accessible to system administrators for maintenance and support purposes.
                </p>
              </div>
            </article>

            {/* Section 4: Third-Party Infrastructure */}
            <article className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-low flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-secondary-fixed flex items-center justify-center text-[12px] font-bold text-on-secondary-fixed flex-shrink-0">
                  4
                </span>
                <h2 className="text-[20px] font-semibold text-on-surface">Third-Party Infrastructure</h2>
              </div>
              <p className="text-[14px] text-on-surface-variant leading-relaxed">
                We rely on established cloud service providers to operate NovaChat:
              </p>
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-start justify-between p-3 bg-surface-container-low rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-on-surface">Supabase Cloud</span>
                    <span className="text-[12px] text-on-surface-variant">Database hosting, authentication services, real-time subscription feeds, and media storage buckets.</span>
                  </div>
                  <Icon name="verified" className="text-outline text-[18px] flex-shrink-0 ml-2" />
                </div>
                <div className="flex items-start justify-between p-3 bg-surface-container-low rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-on-surface">Web Push Notification Services</span>
                    <span className="text-[12px] text-on-surface-variant">Standard Web Push API using VAPID keys for browser notifications (if enabled).</span>
                  </div>
                  <Icon name="notifications_active" className="text-outline text-[18px] flex-shrink-0 ml-2" />
                </div>
              </div>
            </article>

            {/* Section 5: Your Rights & Requests */}
            <article className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-low flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-secondary-fixed flex items-center justify-center text-[12px] font-bold text-on-secondary-fixed flex-shrink-0">
                  5
                </span>
                <h2 className="text-[20px] font-semibold text-on-surface">Your Rights & Requests</h2>
              </div>
              <p className="text-[14px] text-on-surface-variant leading-relaxed">
                You have the right to request access to your data or account deletion:
              </p>
              <div className="grid grid-cols-1 gap-2 mt-1">
                <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl">
                  <div className="flex items-center gap-3">
                    <Icon name="download" className="text-primary text-[20px]" />
                    <span className="text-[14px] font-medium text-on-surface">Data Export Request</span>
                  </div>
                  <span className="text-[12px] text-on-surface-variant font-medium">Contact Support</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl">
                  <div className="flex items-center gap-3">
                    <Icon name="delete_forever" className="text-tertiary text-[20px]" />
                    <span className="text-[14px] font-medium text-on-surface">Account Deletion Request</span>
                  </div>
                  <span className="text-[12px] text-on-surface-variant font-medium">Contact Support</span>
                </div>
              </div>
            </article>

            {/* Section 6: Contact Us */}
            <section className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-low flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-secondary-fixed flex items-center justify-center text-[12px] font-bold text-on-secondary-fixed flex-shrink-0">
                  6
                </span>
                <h2 className="text-[20px] font-semibold text-on-surface">Contact Us</h2>
              </div>
              <p className="text-[14px] text-on-surface-variant leading-relaxed">
                Have questions or privacy inquiries regarding NovaChat? Contact support directly:
              </p>
              <div className="flex flex-col gap-3">
                <a
                  className="flex items-center justify-between p-4 bg-surface-container-low hover:bg-surface-container transition-colors rounded-xl group border border-surface-container"
                  href="mailto:privacy@novachat.app"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed flex-shrink-0">
                      <Icon name="verified_user" className="text-[18px]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-on-surface-variant font-medium">Privacy Inquiry</span>
                      <span className="text-[14px] text-primary font-semibold">privacy@novachat.app</span>
                    </div>
                  </div>
                  <Icon name="chevron_right" className="text-primary group-hover:translate-x-0.5 transition-transform text-[20px]" />
                </a>

                <a
                  className="flex items-center justify-between p-4 bg-surface-container-low hover:bg-surface-container transition-colors rounded-xl group border border-surface-container"
                  href="mailto:support@novachat.app"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed flex-shrink-0">
                      <Icon name="support_agent" className="text-[18px]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-on-surface-variant font-medium">General Support</span>
                      <span className="text-[14px] text-primary font-semibold">support@novachat.app</span>
                    </div>
                  </div>
                  <Icon name="chevron_right" className="text-primary group-hover:translate-x-0.5 transition-transform text-[20px]" />
                </a>
              </div>
            </section>
          </div>
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
            <Link to="/terms" className="text-[12px] font-medium hover:underline">Terms of Service</Link>
          </div>
        </footer>
      </main>
    </div>
  )
}
