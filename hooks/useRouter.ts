import { useMemo } from "react";
import { useRouter as useNextRouter } from "next/router";

// Hook
export function useRouter() {
  const router = useNextRouter();

  // Return our custom router object
  // Memoize so that a new object is only returned if something changes
  return useMemo(() => router, [router]);
}
