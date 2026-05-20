import type { ToastState } from "../hooks/useToast"

export default function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <div className={`px-4 py-3 rounded shadow-md text-sm font-medium flex items-center transition-all ${
        toast.type === 'success' 
          ? 'bg-green-50 border border-green-200 text-green-800' 
          : 'bg-red-50 border border-red-200 text-red-800'
      }`}>
        {toast.type === 'success' ? (
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        ) : (
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        )}
        {toast.message}
      </div>
    </div>
  )
}
