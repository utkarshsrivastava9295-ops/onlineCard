import { useCallback, useState } from "react";

const SESSION_KEY = "inviteshop_session_id";

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${crypto.randomUUID()}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useSession() {
  const [sessionId] = useState(getOrCreateSessionId);
  const resetSession = useCallback(() => {
    const newId = `sess_${crypto.randomUUID()}`;
    localStorage.setItem(SESSION_KEY, newId);
    window.location.reload();
  }, []);
  return { sessionId, resetSession };
}
