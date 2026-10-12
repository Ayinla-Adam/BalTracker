/* BalTracker browser Supabase client.
   The publishable key is intended for browser use. Never place a service-role key here. */
(function () {
  const SUPABASE_URL = "https://gfryyeaqrvlopinsyawj.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_th9BO3WxorZDIqMjaZ8CHA_NCxGi18G";
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase library failed to load.");
    return;
  }
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
})();
