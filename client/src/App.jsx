import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import OnboardingPage from './pages/auth/OnboardingPage.jsx'
import ChatListPage from './pages/chat/ChatListPage.jsx'
import ChatThreadPage from './pages/chat/ChatThreadPage.jsx'
import ContactsPage from './pages/contacts/ContactsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import NewGroupPage from './pages/groups/NewGroupPage.jsx'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx'
import TermsPage from './pages/TermsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/chats" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/chats" element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
        <Route path="/chats/:chatId" element={<ProtectedRoute><ChatThreadPage /></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
        <Route path="/groups/new" element={<ProtectedRoute><NewGroupPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

