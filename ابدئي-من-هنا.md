# بورتفوليو ريم مع لوحة تحكم

هذا المشروع يحافظ على التصميم الأخير، ويضيف لوحة تحكم خاصة تسمح لك بتعديل المحتوى بدون الرجوع للكود.

## ما الذي يمكنك تعديله؟

- الاسم والمسمى والنبذة وحالة التوفر.
- البريد وروابط LinkedIn وGitHub والسيرة الذاتية.
- المهارات وبيانات التعليم.
- إضافة وتعديل وحذف وإخفاء وترتيب المشاريع والشهادات.
- التدريب والبرامج والخبرات التطوعية.
- رفع صور المشاريع وشعارات الجهات.
- مشاهدة رسائل التواصل.

رابط الموقع بعد النشر: https://reembalshammari.vercel.app

رابط لوحة التحكم: https://reembalshammari.vercel.app/admin

## 1. فتح المشروع

فكّي الضغط، ثم افتحي المجلد كاملًا في Visual Studio Code من:

File → Open Folder → reem-portfolio-cms

## 2. إنشاء مشروع Supabase

1. افتحي https://supabase.com وسجلي الدخول.
2. اختاري New project.
3. اسم المشروع: reem-portfolio
4. أنشئي كلمة مرور قوية لقاعدة البيانات واحفظيها.
5. انتظري حتى يجهز المشروع.

## 3. إنشاء الجداول والحماية

داخل Supabase اختاري SQL Editor ثم New query.

افتحي الملف supabase/setup.sql في VS Code، وانسخي محتواه كاملًا إلى SQL Editor ثم اضغطي Run.

## 4. إنشاء حساب لوحة التحكم

داخل Supabase:

Authentication → Users → Add user → Create new user

اكتبي بريدك وكلمة مرور قوية، وفعّلي Auto confirm user.

بعدها ارجعي إلى SQL Editor وشغّلي هذا السطر بعد تغيير البريد:

    insert into public.admin_users (user_id)
    select id from auth.users
    where email = 'YOUR_EMAIL@example.com'
    on conflict (user_id) do nothing;

هذا يجعل حسابك وحده قادرًا على تعديل الموقع.

## 5. ربط الموقع بـSupabase

من Project Settings → API انسخي Project URL وPublishable key أو Anon key.

افتحي assets/js/config.js واستبدلي PASTE_SUPABASE_URL_HERE بالرابط، وPASTE_SUPABASE_PUBLISHABLE_KEY_HERE بالمفتاح العام.

مهم: لا تضعي Secret Key أو Service Role داخل config.js.

## 6. إنشاء حساب Resend

1. افتحي https://resend.com
2. سجلي بالبريد الذي تريدين استقبال الرسائل عليه.
3. افتحي API Keys واختاري Create API Key.
4. سمي المفتاح Reem Portfolio.
5. انسخي المفتاح واحتفظي به، ولا تضعيه داخل ملفات المشروع.

## 7. رفع المشروع إلى GitHub

من Terminal داخل VS Code:

    git init
    git add .
    git commit -m "Build Reem portfolio CMS"
    git branch -M main
    git remote add origin رابط-المستودع
    git push -u origin main

إذا كان المستودع مربوطًا من قبل:

    git add .
    git commit -m "Add portfolio admin dashboard"
    git push

## 8. النشر على Vercel

1. افتحي https://vercel.com وسجلي باستخدام GitHub.
2. اختاري Add New ثم Project.
3. اختاري مستودع الموقع.
4. اكتبي اسم المشروع reembalshammari.
5. اضغطي Deploy.

## 9. متغيرات البيئة في Vercel

من Settings → Environment Variables أضيفي:

- RESEND_API_KEY: مفتاح Resend.
- CONTACT_TO_EMAIL: بريدك المسجل في Resend.
- RESEND_FROM_EMAIL: Reem Portfolio <onboarding@resend.dev>
- SUPABASE_URL: رابط مشروع Supabase.
- SUPABASE_SECRET_KEY: Secret Key من Supabase API Keys.

يمكن استخدام Legacy service_role إذا كان مشروعك يعرض المفاتيح القديمة.

مهم: SUPABASE_SECRET_KEY وRESEND_API_KEY يوضعان في Vercel فقط.

بعد الحفظ اختاري Deployments ثم آخر نسخة ثم Redeploy.

## 10. استيراد محتوى الموقع الحالي

افتحي رابطك متبوعًا بـ /admin، وسجلي بالبريد وكلمة المرور اللذين أنشأتهما في Supabase.

اضغطي استيراد المحتوى الحالي مرة واحدة فقط. سيتم إدراج المشاريع والشهادات والتدريب والتطوع والنبذة الحالية في قاعدة البيانات.

## 11. الاستخدام اليومي

لإضافة مشروع: المشاريع والعناصر → إضافة عنصر جديد → اختاري المشاريع → أدخلي البيانات والصورة والترتيب → حفظ العنصر.

لتعديل النبذة: المحتوى العام → عدلي البيانات → حفظ ونشر التعديلات.

بعد الإعداد الأول لن تحتاجي إلى VS Code لتعديل المحتوى. تعودين للكود فقط لتغيير التصميم أو إضافة ميزة برمجية.

## الرسائل

نموذج التواصل يرسل إلى /api/contact. الـBackend يحفظ الرسالة في Supabase لتظهر في لوحة التحكم، ويرسل نسخة إلى بريدك عبر Resend. لا يستخدم FormSubmit.

## الأمان

- لا تنشري SUPABASE_SECRET_KEY.
- لا تنشري RESEND_API_KEY.
- المفتاح العام Publishable/Anon فقط يوضع في config.js.
- لا تشاركي كلمة مرور لوحة التحكم.
