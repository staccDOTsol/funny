"use client";

import { useEffect, useState } from "react";

interface GoogleAuthProps {
  onAuthSuccess: (token: string) => void;
}

export default function GoogleAuth({ onAuthSuccess }: GoogleAuthProps) {
  const [mounted, setMounted] = useState(false);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    setMounted(true);

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error("Google Client ID is not configured");
        return;
      }

      const oauthClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/calendar.readonly'
        ].join(' '),
        callback: (response) => {
          if (response.access_token) {
            onAuthSuccess(response.access_token);
          }
        },
      });

      setClient(oauthClient);
    };

    return () => {
      document.head.removeChild(script);
    };
  }, [onAuthSuccess]);

  if (!mounted) return null;

  return (
    <div className="flex justify-center items-center p-4">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Sign in with Google</h2>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => client?.requestAccessToken()}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
