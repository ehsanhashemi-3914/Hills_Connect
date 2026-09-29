# هیلز کانکت — معماری پیشنهادی برای نسخه‌ی واقعی

این سند برای تیم فنی هیلز نوشته شده و نشون می‌ده بک‌اند این نسخه **سبک** و **بدون پیام‌رسانه**.

## چرا بک‌اندش سبکه

| | پیام‌رسان (نسخه‌ی اول) | هیلز کانکت |
|---|---|---|
| ارتباط لحظه‌ای (WebSocket) | لازمه، برای هر کاربر آنلاین | **ندارد** |
| ذخیره‌ی پیام و فایل | حجم بالا و همیشه در حال رشد | **ندارد** |
| نوع ترافیک | دائمی | درخواست‌های معمولی (REST)، مثل پنل فعلی |
| حساسیت در قطعی اینترنت | بالا (پیام‌رسان محسوب می‌شه) | پایین: بخشی از پنل آموزشیه و پیامی ردوبدل نمی‌کنه |

ارتباط بین اعضا فقط به این شکله: درخواست همکاری ← قبول ← نمایش آیدی تلگرام یا اینستاگرامی که خود عضو ثبت کرده.

## برآورد زیرساخت برای ۲٬۸۰۰ عضو

- **یک سرور کوچیک** (۲ هسته، ۴ گیگ رم) یا یه سرویس داخل بک‌اند فعلی پنل هیلز
- **PostgreSQL** با حدود ۸ جدول؛ حجم داده زیر ۱ گیگابایت
- **ذخیره‌سازی تصویر:** فقط عکس پروفایل و کاور نمونه‌کار (یک Object Storage سازگار با S3)
- **اعلان‌ها:** اعلان داخل اپ + پیامک یا ایمیل برای رویدادهای مهم، مثل قبول درخواست همکاری
- **ورود:** از طریق حساب پنل فعلی هیلز (SSO / توکن)، پس ثبت‌نام جدا لازم نیست

## مدل داده

```
members(id, panel_user_id, name, username, headline, bio, city, role, launch, collab_status,
        verified, featured, suspended, avatar_url, contact_telegram, contact_instagram,
        created_at, last_active_at)
member_skills(member_id, skill, kind)              -- kind: has | looking_for | niche
member_platforms(member_id, platform, handle, followers)
endorsements(member_id, skill, endorser_id)
connections(id, from_id, to_id, note, status, created_at, responded_at)
opportunities(id, author_id, type, title, description, skills[], city, remote, budget, status, created_at)
opportunity_applications(opportunity_id, member_id, note, created_at)
events(id, title, kind, starts_at, place, host_id) + event_rsvps(event_id, member_id)
custom_fields(id, label, type, options[]) + member_custom_values(member_id, field_id, value)
notifications(id, member_id, kind, text, ref_id, read, created_at)
```

## API

همه‌ی این endpointها در دمو داخل فایل `src/data/api.ts` پیاده شدن، با همین اسم‌ها. برای نسخه‌ی واقعی کافیه بدنه‌ی هر تابع با یک `fetch` به سرور جایگزین بشه و رابط کاربری دست نمی‌خوره.

| متد | مسیر | توضیح |
|---|---|---|
| POST | `/auth/code` | ارسال کد پیامکی (یا ورود با توکن پنل) |
| POST | `/auth/verify` | تأیید کد و گرفتن توکن |
| POST | `/members` | ساخت پروفایل (آنبوردینگ) |
| PATCH | `/me` | ویرایش پروفایل |
| GET | `/members?q=&skill=&city=&launch=` | جستجو و فیلتر |
| GET | `/matches` | پیشنهادهای مچ (امتیازدهی سمت سرور) |
| POST | `/members/:id/endorse` | تأیید مهارت |
| POST | `/connections` | درخواست همکاری |
| PATCH | `/connections/:id` | قبول یا رد |
| GET/POST | `/opportunities` | فهرست و ثبت فرصت |
| POST | `/opportunities/:id/apply` | درخواست برای فرصت |
| POST | `/events/:id/rsvp` | ثبت حضور در رویداد |
| GET | `/notifications` | اعلان‌ها |
| GET | `/admin/stats` | داده‌های داشبورد مدیریت |
| PATCH | `/admin/members/:id` | تأیید، ویژه، منتور، تعلیق |
| PATCH | `/admin/opportunities/:id` | تأیید یا رد فرصت |
| PUT | `/admin/platform` | اطلاعیه، لانچ‌ها، دسته‌بندی مهارت‌ها |
| POST/DELETE | `/admin/custom-fields` | فیلدهای سفارشی پروفایل |

## الگوریتم مچینگ

قاعده‌محور و شفافه (`src/data/match.ts`). هر امتیاز یک دلیل قابل‌نمایش داره:

- مهارت‌های اون عضو ∩ چیزی که من دنبالشم: وزن بالا
- مهارت‌های من ∩ چیزی که اون دنبالشه: وزن متوسط
- هم‌حوزه، هم‌شهری، منتور بودن، آماده‌ی همکاری بودن، فعالیت اخیر و هم‌لانچ بودن: وزن کم

برای ۲٬۸۰۰ عضو می‌شه امتیازها رو شبانه برای هر عضو از قبل محاسبه کرد (کمتر از یک ثانیه با یک کوئری SQL). بعدها می‌شه یه مدل هوش مصنوعی هم برای رتبه‌بندی اضافه کرد، ولی برای شروع لازم نیست.
