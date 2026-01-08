import { useState, useEffect } from "react";

export interface VeriTixUser {
  nric: string;
  walletAddress: string;
  seed?: string; // Only in demo, never expose to UI
}

/**
 * Get user from localStorage (primary source for demo)
 */
function getUserFromStorage(): VeriTixUser | null {
  try {
    const stored = localStorage.getItem("veritix_user");
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Auth hook that uses localStorage primarily, optionally verifies with backend
 * In production, replace with proper session/auth system
 */
export function useAuth() {
  const [user, setUser] = useState<VeriTixUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = getUserFromStorage();
    setUser(storedUser);
    setIsLoading(false);

    // Optional: Verify with backend (non-blocking)
    if (storedUser) {
      // Silently verify with backend, but don't block if it fails
      fetch(`/api/auth/user?nric=${encodeURIComponent(storedUser.nric)}`)
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          return null;
        })
        .then((verifiedUser) => {
          // If backend returns user, update local state (but don't overwrite if backend fails)
          if (verifiedUser) {
            // Merge backend data with localStorage data
            const updated = {
              ...storedUser,
              ...verifiedUser,
            };
            localStorage.setItem("veritix_user", JSON.stringify(updated));
            setUser(updated);
          }
        })
        .catch(() => {
          // Ignore errors - localStorage is source of truth for demo
        });
    }

    // Listen for user changes
    const handleUserChange = () => {
      const newUser = getUserFromStorage();
      setUser(newUser);
    };

    window.addEventListener("veritix_user_changed", handleUserChange);
    window.addEventListener("storage", handleUserChange);

    return () => {
      window.removeEventListener("veritix_user_changed", handleUserChange);
      window.removeEventListener("storage", handleUserChange);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("veritix_user");
    setUser(null);
    window.dispatchEvent(new CustomEvent("veritix_user_changed"));
    window.location.href = "/login";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    isLoggingOut: false,
  };
}
