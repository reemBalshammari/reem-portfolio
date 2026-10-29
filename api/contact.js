const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();
    const website = String(body.website || "").trim();

    // Honeypot: البوت يعبئ هذا الحقل، المستخدم الحقيقي لا يراه.
    if (website) return Response.json({ success: true });

    if (name.length < 2 || name.length > 80) {
      return Response.json({ success: false, message: "يرجى كتابة اسم صحيح." }, { status: 400 });
    }
    if (!emailPattern.test(email) || email.length > 150) {
      return Response.json({ success: false, message: "يرجى إدخال بريد إلكتروني صحيح." }, { status: 400 });
    }
    if (message.length < 10 || message.length > 3000) {
      return Response.json({ success: false, message: "يجب أن تكون الرسالة بين 10 و3000 حرف." }, { status: 400 });
    }

    const required = ["RESEND_API_KEY", "CONTACT_TO_EMAIL", "SUPABASE_URL", "SUPABASE_SECRET_KEY"];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) {
      console.error("Missing environment variables:", missing.join(", "));
      return Response.json({ success: false, message: "خدمة التواصل غير مهيأة حاليًا." }, { status: 500 });
    }

    // حفظ الرسالة في لوحة التحكم.
    const dbResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/contact_messages`, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ name, email, message })
    });
    if (!dbResponse.ok) {
      console.error("Supabase insert failed:", await dbResponse.text());
    }

    // إرسال نسخة إلى بريد ريم.
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Reem Portfolio <onboarding@resend.dev>",
        to: [process.env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `رسالة جديدة من معرض أعمال ريم — ${name}`,
        text: `الاسم: ${name}\nالبريد: ${email}\n\nالرسالة:\n${message}`,
        html: `
          <div dir="rtl" style="max-width:620px;margin:auto;padding:30px;background:#f3f6f5;border-radius:24px;font-family:Arial;color:#10262e">
            <div style="background:#08766f;color:white;padding:22px;border-radius:18px">
              <small style="color:#c8eee1">REEM PORTFOLIO</small>
              <h1 style="margin:7px 0 0;font-size:24px">رسالة جديدة من معرض الأعمال</h1>
            </div>
            <div style="background:white;padding:22px;border-radius:18px;margin-top:14px">
              <p><strong>الاسم:</strong> ${escapeHtml(name)}</p>
              <p><strong>البريد:</strong> ${escapeHtml(email)}</p>
              <hr style="border:0;border-top:1px solid #dce5e2;margin:20px 0">
              <p style="line-height:1.9">${escapeHtml(message).replaceAll("\n", "<br>")}</p>
            </div>
          </div>`
      })
    });

    if (!emailResponse.ok) {
      console.error("Resend failed:", await emailResponse.text());
      return Response.json({ success: false, message: "تم حفظ الرسالة، لكن تعذر إرسال إشعار البريد." }, { status: 502 });
    }

    return Response.json({ success: true, message: "وصلت رسالتك بنجاح، شكرًا لتواصلك." });
  } catch (error) {
    console.error("Contact function error:", error);
    return Response.json({ success: false, message: "حدث خطأ أثناء الإرسال. حاولي مرة أخرى." }, { status: 500 });
  }
}
