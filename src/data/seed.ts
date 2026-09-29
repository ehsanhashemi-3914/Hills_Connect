// Demo data. Every member here is fictional — a sample of what a 2,800-member
// Hills community would look like inside Hills Connect.

import type { DB, HillsEvent, Member, Opportunity, PortfolioItem } from './types'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export const SKILL_CATALOG: Record<string, string[]> = {
  'تولید ویدیو': ['فیلمبرداری', 'تدوین', 'موشن‌گرافیک', 'رنگ‌بندی', 'صداگذاری'],
  'طراحی و تصویر': ['طراحی تامنیل', 'کاور ریلز', 'برندینگ', 'عکاسی'],
  'نویسندگی': ['سناریونویسی', 'کپی‌رایتینگ', 'کپشن‌نویسی'],
  'رشد و بازاریابی': ['استراتژی محتوا', 'مدیریت پیج', 'تبلیغات', 'سئوی یوتیوب'],
  'اجرا': ['اجرا جلوی دوربین', 'گویندگی', 'لایو'],
  'فنی': ['هوش مصنوعی', 'اتوماسیون', 'سایت‌سازی'],
}

export const EXTRA_LOOKING = ['هم‌تیمی لایو', 'اسپانسر', 'منتور']

export const NICHES = [
  'آشپزی', 'فیتنس', 'تکنولوژی', 'آموزش زبان', 'کسب‌وکار', 'سبک زندگی', 'سفر', 'مالی', 'سلامت', 'هنر', 'طنز', 'بازی',
]

export const CITIES = ['تهران', 'اصفهان', 'مشهد', 'شیراز', 'تبریز', 'کرج', 'رشت', 'اهواز', 'قم', 'کیش']

type Row = [
  id: string, name: string, username: string, color: number, headline: string, city: string,
  role: Member['role'], launch: number, skills: string[], looking: string[], niches: string[],
  platforms: Member['platforms'], collab: Member['collab'], bio: string, verified?: boolean,
]

const ROWS: Row[] = [
  ['m1', 'سارا محمدی', 'sara.reels', 6, 'منتور اینستاگرام و ریلز', 'تهران', 'mentor', 1,
    ['استراتژی محتوا', 'کپشن‌نویسی', 'مدیریت پیج'], ['منتور'], ['سبک زندگی', 'کسب‌وکار'],
    { instagram: { handle: 'sara.reels', followers: 210_000 } }, 'busy', 'شش سال تولید محتوا و رشد پیج‌های سبک زندگی. اینجام که به بچه‌های هیلز کمک کنم سریع‌تر رشد کنن.', true],
  ['m2', 'امیر حسینی', 'amir.yt', 0, 'منتور یوتیوب · سناریو و رشد کانال', 'تهران', 'mentor', 1,
    ['سناریونویسی', 'سئوی یوتیوب', 'طراحی تامنیل'], ['تدوین'], ['تکنولوژی', 'کسب‌وکار'],
    { youtube: { handle: 'AmirHosseini', followers: 86_000 } }, 'hiring', 'کانالم رو از صفر به ۸۶ هزار رسوندم. دنبال یه تدوینگر ثابت برای همکاری بلندمدتم.', true],
  ['m3', 'نیلوفر کریمی', 'niloofar.brand', 4, 'منتور لینکدین و برند شخصی', 'شیراز', 'mentor', 1,
    ['برندینگ', 'کپی‌رایتینگ', 'استراتژی محتوا'], ['عکاسی'], ['کسب‌وکار', 'مالی'],
    { linkedin: { handle: 'niloofar-karimi', followers: 42_000 } }, 'open', 'به متخصص‌ها کمک می‌کنم تو لینکدین دیده بشن و مشتری بگیرن.', true],
  ['m4', 'کاوه رستمی', 'kaveh.ai', 5, 'منتور تولید محتوا با هوش مصنوعی', 'تهران', 'mentor', 2,
    ['هوش مصنوعی', 'اتوماسیون', 'موشن‌گرافیک'], ['اجرا جلوی دوربین'], ['تکنولوژی'],
    { youtube: { handle: 'KavehAI', followers: 55_000 }, instagram: { handle: 'kaveh.ai', followers: 38_000 } }, 'open', 'ابزارهای AI رو به زبان ساده یاد می‌دم. دنبال یه مجری برای سری ویدیوهای جدیدم.', true],
  ['u1', 'علی رضایی', 'ali.edit', 2, 'تدوینگر و موشن‌دیزاینر', 'تهران', 'member', 2,
    ['تدوین', 'موشن‌گرافیک', 'رنگ‌بندی'], ['سناریونویسی', 'اسپانسر'], ['تکنولوژی', 'سفر'],
    { instagram: { handle: 'ali.edit', followers: 12_000 } }, 'open', 'ریلز و ویدیوی یوتیوب تدوین می‌کنم. ریتم تند و تایپوگرافی حرکتی تخصصمه.'],
  ['u2', 'مریم احمدی', 'maryam.cooks', 1, 'پیج آشپزی خونگی', 'مشهد', 'member', 2,
    ['اجرا جلوی دوربین', 'عکاسی'], ['تدوین', 'کاور ریلز'], ['آشپزی'],
    { instagram: { handle: 'maryam.cooks', followers: 8_400 } }, 'open', 'غذاهای خونگی سریع برای آدمای پرمشغله. دنبال یه تدوینگر برای ریلزهام.'],
  ['u3', 'رضا کاظمی', 'reza.tech', 5, 'یوتیوبر تکنولوژی', 'کرج', 'member', 1,
    ['اجرا جلوی دوربین', 'سناریونویسی'], ['تدوین', 'طراحی تامنیل'], ['تکنولوژی'],
    { youtube: { handle: 'RezaTech', followers: 31_000 } }, 'hiring', 'بررسی گوشی و گجت. هفته‌ای دو ویدیو منتشر می‌کنم و به تدوینگر نیاز دارم.'],
  ['u4', 'زهرا نوری', 'zahra.design', 6, 'طراح تامنیل و کاور', 'تبریز', 'member', 2,
    ['طراحی تامنیل', 'کاور ریلز', 'برندینگ'], ['اسپانسر', 'مدیریت پیج'], ['هنر', 'تکنولوژی'],
    { instagram: { handle: 'zahra.design', followers: 19_000 } }, 'open', 'تامنیل‌هایی طراحی می‌کنم که کلیک می‌خورن. بیش از ۳۰۰ تامنیل برای کانال‌های فارسی.'],
  ['u5', 'محمد جعفری', 'mohammad.film', 3, 'فیلمبردار و نورپرداز', 'اصفهان', 'member', 1,
    ['فیلمبرداری', 'رنگ‌بندی', 'عکاسی'], ['اجرا جلوی دوربین', 'اسپانسر'], ['سفر', 'هنر'],
    { instagram: { handle: 'mohammad.film', followers: 6_100 } }, 'open', 'فیلمبرداری تبلیغاتی و ولاگ سفر. تجهیزات کامل نور و صدا دارم.'],
  ['u6', 'فاطمه صادقی', 'fatemeh.english', 4, 'مدرس زبان انگلیسی', 'تهران', 'member', 2,
    ['اجرا جلوی دوربین', 'لایو', 'کپشن‌نویسی'], ['تدوین', 'هم‌تیمی لایو'], ['آموزش زبان'],
    { instagram: { handle: 'fatemeh.english', followers: 47_000 } }, 'open', 'آموزش زبان با ریلزهای ۳۰ ثانیه‌ای. دنبال هم‌تیمی برای لایوهای مشترک.'],
  ['u7', 'حسین مرادی', 'hossein.shop', 0, 'فروشگاه آنلاین کمپینگ', 'رشت', 'member', 2,
    ['تبلیغات', 'مدیریت پیج'], ['فیلمبرداری', 'کپی‌رایتینگ'], ['سفر', 'کسب‌وکار'],
    { instagram: { handle: 'hossein.camp', followers: 22_000 } }, 'hiring', 'لوازم کمپینگ می‌فروشم. برای معرفی محصول دنبال فیلمبردار و کپی‌رایترم.'],
  ['u8', 'پریسا اکبری', 'parisa.writes', 2, 'سناریونویس و کپی‌رایتر', 'تهران', 'member', 1,
    ['سناریونویسی', 'کپی‌رایتینگ', 'کپشن‌نویسی'], ['اجرا جلوی دوربین', 'تدوین'], ['کسب‌وکار', 'طنز'],
    { linkedin: { handle: 'parisa-akbari', followers: 3_200 } }, 'open', 'برای ریلز و یوتیوب سناریو می‌نویسم؛ از هوک تا CTA.'],
  ['u9', 'مهدی شریفی', 'mahdi.podcast', 1, 'پادکستر روایت کسب‌وکار', 'قم', 'member', 2,
    ['گویندگی', 'صداگذاری'], ['طراحی تامنیل', 'اسپانسر'], ['کسب‌وکار', 'مالی'],
    { youtube: { handle: 'MahdiPodcast', followers: 15_000 }, telegram: { handle: 'mahdipodcast', followers: 9_000 } }, 'open', 'داستان کسب‌وکارهای ایرانی رو روایت می‌کنم. صدای گرم دارم، ادیت صدا هم بلدم.'],
  ['u10', 'الهام قاسمی', 'elham.fit', 3, 'مربی فیتنس آنلاین', 'کیش', 'member', 2,
    ['اجرا جلوی دوربین', 'لایو'], ['تدوین', 'کاور ریلز', 'اسپانسر'], ['فیتنس', 'سلامت'],
    { instagram: { handle: 'elham.fit', followers: 64_000 } }, 'busy', 'تمرین‌های خونگی کوتاه. پیجم تو شش ماه ۶۰ هزار دنبال‌کننده گرفت.'],
  ['u11', 'امید طاهری', 'omid.dev', 5, 'برنامه‌نویس و عاشق ابزارهای AI', 'تهران', 'member', 2,
    ['هوش مصنوعی', 'اتوماسیون', 'سایت‌سازی'], ['اجرا جلوی دوربین', 'سناریونویسی'], ['تکنولوژی'],
    { linkedin: { handle: 'omid-taheri' } }, 'open', 'برای تولیدکننده‌ها ابزار اتوماسیون می‌سازم. می‌خوام کانال آموزشی خودم رو راه بندازم.'],
  ['u12', 'نگار باقری', 'negar.admin', 6, 'مدیر پیج و استراتژیست محتوا', 'تهران', 'member', 1,
    ['مدیریت پیج', 'استراتژی محتوا', 'کپشن‌نویسی'], ['عکاسی', 'اسپانسر'], ['سبک زندگی', 'سلامت'],
    { instagram: { handle: 'negar.strategy', followers: 11_000 } }, 'open', 'پیج شش برند رو مدیریت می‌کنم. تقویم محتوا و گزارش ماهانه تخصصمه.'],
  ['u13', 'سینا ابراهیمی', 'sina.studio', 0, 'صاحب استودیو ضبط', 'تهران', 'member', 1,
    ['فیلمبرداری', 'صداگذاری'], ['اجرا جلوی دوربین', 'تبلیغات'], ['کسب‌وکار'],
    { instagram: { handle: 'sina.studio', followers: 9_800 } }, 'hiring', 'استودیو ضبط ویدیو و پادکست با تخفیف ویژه‌ی اعضای هیلز.'],
  ['u14', 'یاسمن فرهادی', 'yasaman.photo', 4, 'عکاس پرتره و محصول', 'اصفهان', 'member', 2,
    ['عکاسی', 'رنگ‌بندی'], ['مدیریت پیج', 'اسپانسر'], ['هنر', 'سبک زندگی'],
    { instagram: { handle: 'yasaman.photo', followers: 14_000 } }, 'open', 'عکاسی پرتره برای برند شخصی و عکاسی محصول برای فروشگاه‌ها.'],
  ['u15', 'آرش نظری', 'arash.mkt', 2, 'مارکتینگ و تبلیغات دیجیتال', 'تهران', 'member', 1,
    ['تبلیغات', 'استراتژی محتوا'], ['طراحی تامنیل', 'کپی‌رایتینگ'], ['کسب‌وکار', 'مالی'],
    { linkedin: { handle: 'arash-nazari', followers: 7_500 } }, 'hiring', 'کمپین تبلیغاتی با اینفلوئنسرها طراحی می‌کنم. همیشه دنبال تولیدکننده‌ی خوبم.'],
  ['u16', 'ترانه موسوی', 'taraneh.travel', 1, 'ولاگر سفر', 'شیراز', 'member', 2,
    ['اجرا جلوی دوربین', 'فیلمبرداری'], ['تدوین', 'اسپانسر'], ['سفر'],
    { instagram: { handle: 'taraneh.travel', followers: 28_000 }, youtube: { handle: 'TaranehTravel', followers: 4_000 } }, 'open', 'ایران‌گردی کم‌هزینه. هر ماه یه شهر جدید.'],
  ['u17', 'بهراد کیانی', 'behrad.motion', 5, 'موشن‌دیزاینر', 'کرج', 'member', 2,
    ['موشن‌گرافیک', 'تدوین'], ['سناریونویسی', 'گویندگی'], ['تکنولوژی', 'بازی'],
    { instagram: { handle: 'behrad.motion', followers: 5_200 } }, 'open', 'اینترو، تایتل و اینفوگرافیک متحرک برای یوتیوب.'],
  ['u18', 'شیما رحمانی', 'shima.money', 3, 'تولیدکننده‌ی محتوای مالی', 'تهران', 'member', 2,
    ['اجرا جلوی دوربین', 'سناریونویسی'], ['موشن‌گرافیک', 'تدوین'], ['مالی', 'کسب‌وکار'],
    { instagram: { handle: 'shima.money', followers: 36_000 } }, 'open', 'سواد مالی به زبان ساده. دنبال موشن‌دیزاینر برای اینفوگرافیک‌ها.'],
  ['u19', 'کیان صالحی', 'kian.gamer', 0, 'استریمر بازی', 'مشهد', 'member', 2,
    ['لایو', 'گویندگی'], ['تدوین', 'طراحی تامنیل'], ['بازی', 'طنز'],
    { youtube: { handle: 'KianPlays', followers: 21_000 } }, 'open', 'استریم و ویدیوهای طنز گیمینگ.'],
  ['u20', 'هانیه جلالی', 'hanieh.health', 4, 'متخصص تغذیه', 'تبریز', 'member', 1,
    ['اجرا جلوی دوربین', 'کپشن‌نویسی'], ['کاور ریلز', 'تدوین'], ['سلامت', 'آشپزی'],
    { instagram: { handle: 'dr.hanieh', followers: 52_000 } }, 'busy', 'تغذیه‌ی علمی بدون رژیم‌های عجیب.'],
  ['u21', 'پوریا عزیزی', 'pooria.voice', 1, 'گوینده و صداپیشه', 'تهران', 'member', 2,
    ['گویندگی', 'صداگذاری'], ['موشن‌گرافیک', 'اسپانسر'], ['هنر', 'طنز'],
    { instagram: { handle: 'pooria.voice', followers: 8_900 } }, 'open', 'گویندگی تیزر، پادکست و ویدیوی آموزشی.'],
  ['u22', 'مینا کرمانی', 'mina.brand', 6, 'طراح برند شخصی', 'اصفهان', 'member', 2,
    ['برندینگ', 'طراحی تامنیل', 'کاور ریلز'], ['کپی‌رایتینگ', 'مدیریت پیج'], ['هنر', 'کسب‌وکار'],
    { instagram: { handle: 'mina.brand', followers: 17_000 } }, 'open', 'هویت بصری پیج رو از لوگو تا قالب پست طراحی می‌کنم.'],
  ['u23', 'دانیال فتحی', 'danial.drone', 3, 'فیلمبردار هوایی', 'رشت', 'member', 1,
    ['فیلمبرداری', 'تدوین'], ['اسپانسر', 'مدیریت پیج'], ['سفر', 'هنر'],
    { instagram: { handle: 'danial.drone', followers: 26_000 } }, 'open', 'تصاویر هوایی از طبیعت شمال. پروژه‌ی تبلیغاتی هم قبول می‌کنم.'],
  ['u24', 'رویا شکوهی', 'roya.writes', 2, 'کپی‌رایتر فروش', 'شیراز', 'member', 2,
    ['کپی‌رایتینگ', 'کپشن‌نویسی'], ['طراحی تامنیل', 'تبلیغات'], ['کسب‌وکار', 'سبک زندگی'],
    { linkedin: { handle: 'roya-shokouhi', followers: 2_100 } }, 'open', 'متن‌هایی می‌نویسم که می‌فروشن؛ از کپشن تا صفحه‌ی فروش.'],
  ['u25', 'سعید نیک‌نام', 'saeed.live', 5, 'مجری لایو و رویداد', 'تهران', 'member', 1,
    ['لایو', 'اجرا جلوی دوربین', 'گویندگی'], ['هم‌تیمی لایو', 'اسپانسر'], ['طنز', 'سبک زندگی'],
    { instagram: { handle: 'saeed.live', followers: 33_000 } }, 'open', 'اجرای لایو و رویدادهای آنلاین با انرژی بالا.'],
  ['u26', 'نازنین حیدری', 'nazanin.art', 6, 'تصویرساز', 'تهران', 'member', 2,
    ['برندینگ', 'کاور ریلز'], ['موشن‌گرافیک', 'اسپانسر'], ['هنر'],
    { instagram: { handle: 'nazanin.art', followers: 24_000 } }, 'open', 'تصویرسازی دیجیتال برای کاور و استیکر.'],
  ['u27', 'فرزاد امینی', 'farzad.seo', 4, 'متخصص سئوی یوتیوب', 'کرج', 'member', 2,
    ['سئوی یوتیوب', 'استراتژی محتوا'], ['طراحی تامنیل', 'اجرا جلوی دوربین'], ['تکنولوژی', 'آموزش زبان'],
    { youtube: { handle: 'FarzadSEO', followers: 9_300 } }, 'open', 'عنوان، توضیحات و کلیدواژه‌ای که ویدیو رو دیده‌شدنی می‌کنه.'],
  ['u28', 'آیدا صفری', 'aida.english', 1, 'آموزش زبان برای مهاجرت', 'تهران', 'member', 2,
    ['اجرا جلوی دوربین', 'سناریونویسی'], ['تدوین', 'هم‌تیمی لایو'], ['آموزش زبان', 'سفر'],
    { instagram: { handle: 'aida.english', followers: 18_000 } }, 'open', 'آیلتس و زبان مهاجرت. دنبال هم‌تیمی برای لایو مشترک هفتگی.'],
]

const PORTFOLIO_TITLES: Record<string, [PortfolioItem['kind'], string][]> = {
  'تدوین': [['reels', 'ریلز معرفی محصول'], ['video', 'ولاگ سفر شمال']],
  'موشن‌گرافیک': [['video', 'اینترو کانال تکنولوژی'], ['reels', 'اینفوگرافیک متحرک']],
  'فیلمبرداری': [['video', 'تیزر تبلیغاتی'], ['photo', 'پشت صحنه‌ی ضبط']],
  'طراحی تامنیل': [['design', 'تامنیل بررسی گوشی'], ['design', 'تامنیل ولاگ']],
  'کاور ریلز': [['design', 'قالب کاور ریلز'], ['design', 'گرید پیج آشپزی']],
  'برندینگ': [['design', 'هویت بصری پیج'], ['design', 'لوگوی برند شخصی']],
  'عکاسی': [['photo', 'پرتره‌ی برند شخصی'], ['photo', 'عکاسی محصول']],
  'گویندگی': [['podcast', 'تیزر صوتی'], ['podcast', 'قسمت ۱۲ پادکست']],
  'اجرا جلوی دوربین': [['reels', 'ریلز آموزشی'], ['video', 'ویدیوی معرفی']],
  'سناریونویسی': [['video', 'سناریوی ویدیوی ۱۰ دقیقه‌ای'], ['reels', 'سری هوک‌های ریلز']],
}

function portfolioFor(id: string, skills: string[]): PortfolioItem[] {
  const items: PortfolioItem[] = []
  for (const s of skills) for (const [kind, title] of PORTFOLIO_TITLES[s] ?? []) items.push({ id: `${id}-${items.length}`, kind, title, hue: (id.length * 47 + items.length * 67) % 360 })
  return items.slice(0, 4)
}

function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

export function seedDb(now = Date.now()): DB {
  const members: Record<string, Member> = {}
  for (const r of ROWS) {
    const [id, name, username, color, headline, city, role, launch, skills, lookingFor, niches, platforms, collab, bio, verified] = r
    const h = hash(id)
    members[id] = {
      id, name, username, color, headline, city, role, launch, skills, lookingFor, niches, platforms, collab, bio,
      verified: verified ?? h % 4 === 0,
      featured: ['u1', 'u4', 'u6'].includes(id),
      portfolio: portfolioFor(id, skills),
      endorsements: {},
      baseEndorsements: Object.fromEntries(skills.map((s, i) => [s, ((h >> i) % 18) + 3])),
      collabs: (h % 14) + (role === 'mentor' ? 20 : 1),
      rating: Math.round((4.3 + (h % 7) / 10) * 10) / 10,
      contact: { telegram: username.replace('.', '_'), instagram: platforms.instagram?.handle },
      custom: {},
      joinedAt: now - (launch === 1 ? 260 : 120) * DAY - (h % 40) * DAY,
      lastActive: now - (h % 72) * HOUR,
      seeded: true,
    }
  }
  members.m2.custom = { gear: 'Sony A7IV + میکروفون یقه‌ای' }
  members.u5.custom = { gear: 'Blackmagic 6K + کیت نور کامل' }
  members.u13.custom = { gear: 'استودیو ۴۰ متری، ۳ دوربین' }

  const opp = (authorId: string, hoursAgo: number, o: Omit<Opportunity, 'id' | 'authorId' | 'createdAt' | 'status' | 'applicants'>, status: Opportunity['status'] = 'approved', applicants = 0): Opportunity => ({
    id: 'o' + hash(o.title),
    authorId,
    createdAt: now - hoursAgo * HOUR,
    status,
    applicants: ROWS.slice(4, 4 + applicants).map(([id], i) => ({ memberId: id, at: now - (hoursAgo - i) * HOUR })),
    ...o,
  })

  const opportunities = [
    opp('m2', 2, { type: 'collab', title: 'تدوینگر ثابت برای کانال یوتیوب ۸۶ هزار نفری', description: 'هفته‌ای یک ویدیوی ۱۲ تا ۱۸ دقیقه‌ای. ریتم تدوین، زیرنویس و تایتل متحرک. همکاری بلندمدت و پرداخت ماهانه.', skills: ['تدوین', 'موشن‌گرافیک'], remote: true, budget: 'ماهانه · توافقی' }, 'approved', 7),
    opp('u13', 5, { type: 'studio', title: 'استودیو ضبط با ۳۰٪ تخفیف برای اعضای هیلز', description: 'استودیو ۴۰ متری با سه دوربین، نور حرفه‌ای و میکروفون پادکست. رزرو ساعتی و روزانه.', skills: ['فیلمبرداری', 'صداگذاری'], city: 'تهران', budget: '۳۰٪ تخفیف' }, 'approved', 3),
    opp('u7', 9, { type: 'sponsor', title: 'همکاری تبلیغاتی با پیج‌های سفر و طبیعت‌گردی', description: 'معرفی لوازم کمپینگ؛ پیج‌های ۵ تا ۵۰ هزار نفری. ارسال محصول + هزینه‌ی تبلیغ.', skills: ['اجرا جلوی دوربین', 'فیلمبرداری'], remote: true, budget: 'محصول + هزینه' }, 'approved', 5),
    opp('u3', 20, { type: 'job', title: 'طراح تامنیل پاره‌وقت برای کانال تکنولوژی', description: 'هفته‌ای دو تامنیل با سبک ثابت کانال. نمونه‌کار تامنیل فارسی الزامیه.', skills: ['طراحی تامنیل'], remote: true, budget: 'به‌ازای هر طرح' }, 'approved', 4),
    opp('u15', 30, { type: 'job', title: 'استخدام ادمین اینستاگرام (دورکاری)', description: 'مدیریت دایرکت، زمان‌بندی پست و گزارش هفتگی برای سه پیج فروشگاهی.', skills: ['مدیریت پیج', 'کپشن‌نویسی'], remote: true, budget: 'حقوق ثابت + پورسانت' }, 'approved', 6),
    opp('u28', 44, { type: 'collab', title: 'هم‌تیمی برای لایو هفتگی زبان و مهاجرت', description: 'هر پنجشنبه یک لایو ۴۰ دقیقه‌ای مشترک. مخاطب‌هامون هم‌پوشانی خوبی دارن.', skills: ['لایو', 'اجرا جلوی دوربین'], remote: true }, 'approved', 2),
    opp('m4', 60, { type: 'collab', title: 'مجری برای سری ویدیوهای «AI به زبان ساده»', description: 'ده قسمت ویدیوی کوتاه؛ سناریو و تدوین با تیم ما، اجرا با شما.', skills: ['اجرا جلوی دوربین'], city: 'تهران', budget: 'پروژه‌ای' }, 'approved', 3),
    opp('u18', 3, { type: 'collab', title: 'موشن‌دیزاینر برای اینفوگرافیک‌های مالی', description: 'ماهی چهار اینفوگرافیک متحرک ۳۰ ثانیه‌ای برای پیج آموزش مالی.', skills: ['موشن‌گرافیک'], remote: true, budget: 'پروژه‌ای' }, 'pending'),
    opp('u25', 6, { type: 'sponsor', title: 'دنبال اسپانسر برای رویداد لایو ماهانه', description: 'رویداد آنلاین با میانگین ۱۵۰۰ بیننده‌ی زنده؛ معرفی برند در ابتدا و انتهای لایو.', skills: ['تبلیغات'], remote: true }, 'pending'),
  ]

  const ev = (id: string, title: string, kind: HillsEvent['kind'], inHours: number, place: string, host: string, baseGoing: number): HillsEvent => ({
    id, title, kind, at: now + inHours * HOUR, place, host, going: [], baseGoing,
  })
  const events = [
    ev('e1', 'لایو پرسش و پاسخ: چرا ویدیوهات دیده نمی‌شن؟', 'live', 26, 'آنلاین', 'm2', 412),
    ev('e2', 'دورهمی حضوری اعضای هیلز — تهران', 'meetup', 74, 'تهران، کافه‌ی کتاب', 'm1', 86),
    ev('e3', 'ورکشاپ: ساخت ویدیو با هوش مصنوعی', 'workshop', 122, 'آنلاین', 'm4', 238),
  ]

  const weekly = [18, 24, 21, 33, 29, 41, 38, 52]

  return {
    members,
    phones: {},
    tokens: {},
    connections: [],
    opportunities,
    events,
    notifications: {},
    passed: {},
    platform: {
      announcement: { text: 'ثبت‌نام لانچ سوم هیلز به‌زودی شروع می‌شه — پروفایلت رو کامل کن تا اولین پیشنهادهای همکاری رو بگیری 🚀', enabled: true },
      customFields: [
        { id: 'gear', label: 'تجهیزات', type: 'text', placeholder: 'مثلاً: دوربین، میکروفون، نور', showOnCard: false },
      ],
      launches: [
        { id: 1, title: 'لانچ اول', members: 940, status: 'done' },
        { id: 2, title: 'لانچ دوم', members: 1872, status: 'active' },
        { id: 3, title: 'لانچ سوم', members: 0, status: 'upcoming' },
      ],
      skillCatalog: SKILL_CATALOG,
    },
    totals: { members: 2812, activeWeek: 1204, collabs: 318, weekly },
  }
}
