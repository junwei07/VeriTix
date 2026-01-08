export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

const BLOCKED_NEXT_PATHS = new Set([
  "/login",
  "/verified",
  "/signup",
  "/create-wallet",
]);

export function sanitizeNextPath(next: string | null): string | null {
  if (!next) return null;
  let value = next;
  try {
    value = decodeURIComponent(next);
  } catch {
    value = next;
  }
  if (!value.startsWith("/")) return null;
  if (value.includes("://")) return null;
  if (BLOCKED_NEXT_PATHS.has(value)) return null;
  return value;
}

// Redirect to login with a toast notification
export function redirectToLogin(toast?: (options: { title: string; description: string; variant: string }) => void) {
  if (toast) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
  }
  setTimeout(() => {
    window.location.href = "/login";
  }, 500);
}
