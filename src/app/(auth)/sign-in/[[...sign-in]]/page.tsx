import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <SignIn
      forceRedirectUrl="/app"
      appearance={{
        elements: {
          socialButtonsBlockButton: {
            // Force redirect mode for OAuth (avoids popup + CAPTCHA conflict)
          },
        },
      }}
    />
  );
}
