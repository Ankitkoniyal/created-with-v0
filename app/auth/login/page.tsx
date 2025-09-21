import { Suspense } from 'react'
import LoginForm from './LoginForm'

export const runtime = 'nodejs'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
