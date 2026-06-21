import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="flex-1 grid place-items-center px-6 py-16">
      <div className="reveal">
        <SignUp />
      </div>
    </main>
  );
}
