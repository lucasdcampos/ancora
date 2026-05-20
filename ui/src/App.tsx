import { useAuth } from './hooks/useAuth'
import Auth from './Auth'
import Dashboard from './Dashboard'

function App() {
  const { 
    loading, 
    isAuthenticated, 
    needsBootstrap, 
    login, 
    checkAuth 
  } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-slate-600 font-medium">Loading Ancora...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Dashboard onLogout={checkAuth} />
  }

  return (
    <Auth 
      needsBootstrap={needsBootstrap} 
      onLogin={(pass) => login(pass, needsBootstrap)} 
    />
  )
}

export default App
