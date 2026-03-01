const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PushRequest {
  token: string;
  title: string;
  body: string;
  scheduledAt?: string; // ISO timestamp for delayed send
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const claimB64 = btoa(JSON.stringify(claim)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unsignedToken = `${headerB64}.${claimB64}`;

  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${unsignedToken}.${signatureB64}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    console.error("Token exchange failed:", tokenData);
    throw new Error(`Failed to get access token: ${tokenData.error_description || tokenData.error}`);
  }

  return tokenData.access_token;
}

async function sendFCM(serviceAccount: any, token: string, title: string, body: string) {
  const accessToken = await getAccessToken(serviceAccount);
  console.log("Successfully obtained FCM access token");

  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;
  
  const message = {
    message: {
      token: token,
      notification: {
        title: title || "⏱️ Period Ended!",
        body: body || "Time's up!",
      },
      webpush: {
        notification: {
          icon: "/app-icon.png",
          badge: "/app-icon.png",
          vibrate: [500, 200, 500, 200, 500],
          requireInteraction: true,
          tag: "timer-alarm",
        },
      },
      android: {
        priority: "high",
        notification: {
          channelId: "timer_alarm",
          priority: "max",
          defaultVibrateTimings: false,
          vibrateTimings: ["0.5s", "0.2s", "0.5s", "0.2s", "0.5s"],
        },
      },
    },
  };

  console.log("Sending FCM message to token:", token.substring(0, 20) + "...");

  const fcmResponse = await fetch(fcmUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  const fcmResult = await fcmResponse.json();

  if (!fcmResponse.ok) {
    console.error("FCM send failed:", fcmResult);
    throw new Error(`FCM send failed: ${JSON.stringify(fcmResult)}`);
  }

  console.log("FCM message sent successfully:", fcmResult);
  return fcmResult;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, title, body, scheduledAt }: PushRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing FCM token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      return new Response(
        JSON.stringify({ error: "FCM not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    // If scheduledAt is provided, delay the send server-side
    if (scheduledAt) {
      const delayMs = new Date(scheduledAt).getTime() - Date.now();
      
      if (delayMs > 0) {
        console.log(`Scheduling notification for ${scheduledAt} (${Math.round(delayMs / 1000)}s from now)`);
        
        // Use waitUntil-style: respond immediately, send later
        // Deno edge functions stay alive for the duration of the response
        // So we use a promise that resolves after the delay
        const sendPromise = new Promise<void>((resolve) => {
          setTimeout(async () => {
            try {
              await sendFCM(serviceAccount, token, title, body);
              console.log("Scheduled notification sent successfully");
            } catch (err) {
              console.error("Scheduled notification failed:", err);
            }
            resolve();
          }, delayMs);
        });

        // Keep the function alive until the notification is sent
        // Edge functions have a max execution time, so this works for periods up to ~150 seconds
        // For longer periods, we send immediately as a fallback test
        if (delayMs <= 150000) {
          // Wait for the delayed send (keeps edge function alive)
          await sendPromise;
          return new Response(
            JSON.stringify({ success: true, scheduled: true, scheduledAt }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // For delays > 150s, we can't keep the function alive
          // Return immediately and note the limitation
          console.log(`Delay ${delayMs}ms exceeds edge function limit. Notification may not fire.`);
          // Still try - the function might stay alive
          sendPromise.catch(() => {});
          return new Response(
            JSON.stringify({ 
              success: true, 
              scheduled: true, 
              scheduledAt,
              warning: "Delay exceeds edge function timeout. Notification delivery not guaranteed." 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Immediate send
    const fcmResult = await sendFCM(serviceAccount, token, title, body);

    return new Response(
      JSON.stringify({ success: true, messageId: fcmResult.name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending push notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
