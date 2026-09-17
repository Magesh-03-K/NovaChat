import { useNavigate, Link } from 'react-router-dom'
import Icon from '../components/Shared/Icon.jsx'
import NovaLogo from '../components/Shared/NovaLogo.jsx'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen antialiased">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/80 backdrop-blur-xl shadow-sm pt-safe">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              aria-label="Go Back"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/chats'))}
            >
              <Icon name="arrow_back" className="text-[20px]" />
            </button>
            <NovaLogo size={32} />
            <div className="flex flex-col">
              <span className="text-[11px] text-on-surface-variant font-medium leading-none">NovaChat</span>
              <h1 className="text-[20px] font-semibold text-on-surface leading-tight truncate max-w-[190px]">Page Not Found</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full pt-16 bg-surface">
        <div className="flex flex-col w-full px-4 pb-8 items-center justify-between min-h-[calc(100vh-4rem)]">
          {/* Status Badge */}
          <div className="w-full flex justify-center pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container shadow-sm">
              <Icon name="verified_user" fill className="text-primary text-[14px]" />
              <span className="text-[11px] font-medium text-on-surface-variant tracking-wide">NovaChat Security Active</span>
            </div>
          </div>

          {/* Graphic & 404 Hero */}
          <div className="flex flex-col items-center text-center max-w-sm w-full my-auto py-4">
            <div className="relative flex items-center justify-center mb-4">
              <div
                className="absolute w-56 h-56 rounded-full bg-gradient-to-tr from-secondary-fixed/40 via-primary-fixed-dim/30 to-surface-tint/20 blur-3xl -z-10 animate-pulse"
                style={{ animationDuration: '4s' }}
              ></div>
              <div className="relative flex flex-col items-center">
                <div className="text-[96px] font-black tracking-tight select-none bg-gradient-to-r from-primary-container via-secondary to-secondary-fixed-dim bg-clip-text text-transparent drop-shadow-sm leading-none">
                  404
                </div>
                <div className="relative -mt-6 bg-surface-container-lowest shadow-xl rounded-2xl p-3 flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden flex-shrink-0">
                    <NovaLogo size={28} />
                  </div>
                  <div className="flex flex-col text-left pr-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[12px] text-on-surface font-semibold">NovaChat</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant flex items-center gap-1 font-medium">
                      <Icon name="link_off" className="text-[12px] text-tertiary" />
                      Channel disconnected
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant ml-auto">
                    <Icon name="chat_bubble_outline" className="text-[16px]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-6">
              <h2 className="text-[24px] font-semibold text-on-surface tracking-tight">
                This chat doesn't exist
              </h2>
              <p className="text-[14px] text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                The conversation you're looking for was moved, archived, or never existed in the first place.
              </p>
            </div>

            <div className="flex flex-col w-full gap-3 items-center">
              <Link
                to="/chats"
                className="w-full h-12 rounded-full bg-gradient-to-r from-primary-container to-secondary text-on-primary text-[14px] font-medium flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform hover:opacity-95"
              >
                <Icon name="forum" fill className="text-[20px]" />
                <span>Back to your chats</span>
              </Link>

              <a
                href="mailto:support@novachat.app"
                className="inline-flex items-center gap-1.5 text-primary text-[14px] font-medium py-2 px-3 rounded-lg hover:bg-surface-container transition-colors group"
              >
                <span>Contact support</span>
                <Icon name="arrow_forward" className="text-[16px] transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>

          <div className="w-full max-w-sm flex items-center justify-center gap-4 pt-2">
            <span className="text-[11px] text-outline flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              System operational
            </span>
          </div>
        </div>

        <footer className="w-full mt-auto py-6 px-4 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="text-[12px] font-medium">NovaChat Inc.</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <Link to="/privacy" className="text-[12px] font-medium hover:underline">Privacy Policy</Link>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <Link to="/terms" className="text-[12px] font-medium hover:underline">Terms of Service</Link>
          </div>
        </footer>
      </main>
    </div>
  )
}
