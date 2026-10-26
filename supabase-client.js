/* BalTracker browser Supabase client.
   The publishable key is intended for browser use. Never place a service-role key here. */
(function () {
  const SUPABASE_URL = "https://gfryyeaqrvlopinsyawj.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_th9BO3WxorZDIqMjaZ8CHA_NCxGi18G";
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase library failed to load.");
    return;
  }
  // Respect the sign-in form's "Keep me signed in" choice. Persistent
  // sessions use localStorage; unchecked sessions use sessionStorage instead.
  const REMEMBER_SESSION_KEY = "baltracker_remember_session_v1";
  const AUTH_STORAGE_KEY = "sb-gfryyeaqrvlopinsyawj-auth-token";
  const rememberCheckbox = document.getElementById("rememberSignIn");

  try {
    const savedPreference = localStorage.getItem(REMEMBER_SESSION_KEY);
    if (rememberCheckbox && savedPreference !== null) {
      rememberCheckbox.checked = savedPreference !== "0";
    } else if (savedPreference === null) {
      localStorage.setItem(REMEMBER_SESSION_KEY, rememberCheckbox && !rememberCheckbox.checked ? "0" : "1");
    }
  } catch (storageError) {}

  function shouldRememberSession() {
    try { return localStorage.getItem(REMEMBER_SESSION_KEY) !== "0"; }
    catch (storageError) { return true; }
  }

  const sessionStorageAdapter = {
    getItem(key) {
      try {
        const storage = shouldRememberSession() ? localStorage : sessionStorage;
        const value = storage.getItem(key);
        if (!shouldRememberSession()) localStorage.removeItem(key);
        return value;
      } catch (error) {
        console.warn("BalTracker session storage is unavailable:", error);
        return null;
      }
    },
    setItem(key, value) {
      const remember = shouldRememberSession();
      try {
        (remember ? localStorage : sessionStorage).setItem(key, value);
        (remember ? sessionStorage : localStorage).removeItem(key);
      } catch (error) {
        console.warn("BalTracker could not save the sign-in session:", error);
      }
    },
    removeItem(key) {
      try { localStorage.removeItem(key); } catch (error) {}
      try { sessionStorage.removeItem(key); } catch (error) {}
    }
  };

  if (rememberCheckbox) {
    rememberCheckbox.addEventListener("change", () => {
      const remember = rememberCheckbox.checked;
      try {
        localStorage.setItem(REMEMBER_SESSION_KEY, remember ? "1" : "0");
        const current = (remember ? sessionStorage : localStorage).getItem(AUTH_STORAGE_KEY);
        if (current) (remember ? localStorage : sessionStorage).setItem(AUTH_STORAGE_KEY, current);
        (remember ? sessionStorage : localStorage).removeItem(AUTH_STORAGE_KEY);
      } catch (error) {
        console.warn("BalTracker could not update the sign-in preference:", error);
      }
    });
  }

  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        storage: sessionStorageAdapter,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();
