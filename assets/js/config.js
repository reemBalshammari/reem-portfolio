
window.REEM_CONFIG = {
  SUPABASE_URL: "https://zebdddveynxvziddqitu.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_B0uKDrbbvWPiH03tX1_7pQ_WZHVTNPY"
};

window.reemCmsConfigured = function () {
  const config = window.REEM_CONFIG || {};
  return Boolean(
    config.SUPABASE_URL &&
    config.SUPABASE_PUBLISHABLE_KEY &&
    !config.SUPABASE_URL.includes("PASTE_") &&
    !config.SUPABASE_PUBLISHABLE_KEY.includes("PASTE_")
  );
};
