// app/(root)/login/page.tsx
import LoginForm from "./LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#EFECE3] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border-[3px] border-[#203C67] rounded-2xl shadow-xl p-8">
        <LoginForm />
      </div>
    </div>
  )
}