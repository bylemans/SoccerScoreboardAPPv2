import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
    throw new Error(`Failed to get access token: ${tokenData.error_description || tokenData.error}`);
  }
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all notifications that are due and not yet sent
    const now = new Date().toISOString();
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from("scheduled_notifications")
      .select("*")
      .eq("sent", false)
      .lte("send_at", now);

    if (fetchError) {
      console.error("Error fetching notifications:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${pendingNotifications.length} pending notification(s)`);

    const serviceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      return new Response(
        JSON.stringify({ error: "FCM not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

    let sent = 0;
    for (const notification of pendingNotifications) {
      try {
        const message = {
          message: {
            token: notification.fcm_token,
            notification: {
              title: notification.title,
              body: notification.body,
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

        const fcmResponse = await fetch(fcmUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });

        if (fcmResponse.ok) {
          // Mark as sent
          await supabase
            .from("scheduled_notifications")
            .update({ sent: true })
            .eq("id", notification.id);
          sent++;
          console.log(`Sent notification ${notification.id}`);
        } else {
          const err = await fcmResponse.json();
          console.error(`FCM failed for ${notification.id}:`, err);
          // Delete invalid token notifications
          if (err?.error?.code === 404 || err?.error?.details?.some((d: any) => d.errorCode === "UNREGISTERED")) {
            await supabase.from("scheduled_notifications").delete().eq("id", notification.id);
          }
        }
      } catch (err) {
        console.error(`Error processing notification ${notification.id}:`, err);
      }
    }

    // Clean up old sent notifications (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    await supabase
      .from("scheduled_notifications")
      .delete()
      .eq("sent", true)
      .lt("send_at", oneHourAgo);

    return new Response(
      JSON.stringify({ processed: pendingNotifications.length, sent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
