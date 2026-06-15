export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // This layout bypasses the admin layout authentication check
  return <>{children}</>;
}
