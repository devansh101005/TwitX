import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="flex-1 grid place-items-center px-6 py-16">
      <div className="reveal">
        <SignIn />
      </div>
    </main>
  );
}
