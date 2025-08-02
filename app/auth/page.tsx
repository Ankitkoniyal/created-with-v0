// app/auth/page.tsx
import { AuthForm } from '../../components/AuthForm'; // Make sure it's NAMED import { AuthForm } and this path
                                                 // (assuming your AuthForm.tsx is in project-root/components/)

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm />
    </div>
  );
}