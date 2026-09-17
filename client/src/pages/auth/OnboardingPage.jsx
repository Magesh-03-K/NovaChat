import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'
import NovaLogo from '../../components/Shared/NovaLogo.jsx'
import Icon from '../../components/Shared/Icon.jsx'
import { compressImage } from '../../utils/imageCompressor.js'

export default function OnboardingPage() {
  const [file, setFile] = useState(null)
  const [about, setAbout] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const navigate = useNavigate()

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.type.startsWith('image/')) {
      setCompressing(true)
      try {
        const compressed = await compressImage(selectedFile, 1600, 0.8)
        setFile(compressed)
      } catch (err) {
        setFile(selectedFile)
      } finally {
        setCompressing(false)
      }
    } else {
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let profile_photo_url
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const { data } = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        profile_photo_url = data.url
      }
      await api.put('/users/me', { profile_photo_url, about })
      navigate('/chats')
    } catch (err) {
      setError(err.message || 'Could not save your profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-space-base antialiased">
      <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-3xl shadow-xl border border-surface-container-low space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <NovaLogo size={56} />
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight font-bold">
            Setup Profile
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Customize how other users see you on NovaChat
          </p>
        </div>

        {error && (
          <div className="p-3 bg-tertiary-container/10 text-tertiary-container rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-bold text-2xl shadow-inner relative overflow-hidden">
              {compressing ? (
                <div className="flex flex-col items-center gap-1 text-[11px] font-medium text-primary">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Compressing...</span>
                </div>
              ) : file ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Profile photo preview"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <Icon name="account_circle" className="text-[36px]" />
              )}
            </div>
            <label className="cursor-pointer bg-surface-container text-primary font-label-md text-label-md px-4 py-2 rounded-full font-semibold hover:bg-surface-container-high transition-all">
              Choose Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
              About / Bio
            </label>
            <input
              type="text"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Hey there! I'm using NovaChat"
              className="w-full h-12 bg-surface-container-low border border-surface-container text-on-surface rounded-xl px-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={loading || compressing}
              className="w-full h-12 rounded-full bg-gradient-to-tr from-primary to-primary-container text-on-primary font-title-sm text-title-sm font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Icon name="check_circle" className="text-[20px]" />
              <span>{loading ? 'Saving Profile...' : 'Save & Continue'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/chats')}
              className="w-full h-10 font-label-md text-label-md text-outline hover:text-on-surface transition-colors"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
