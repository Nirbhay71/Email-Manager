import HtmlBody from "@/imports/Html→Body/index";

export default function LoginPage({ onGoogleLogin }: { onGoogleLogin: () => void }) {
  return <HtmlBody onGoogleLogin={onGoogleLogin} />;
}
