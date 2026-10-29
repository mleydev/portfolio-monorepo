import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpLeft,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  Code2,
  ExternalLink,
  FileText,
  Globe2,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";
import "./App.css";

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  count?: number;
};

const navigation: { title: string; items: NavItem[] }[] = [
  {
    title: "عمومی",
    items: [
      { label: "داشبورد", icon: LayoutDashboard },
      { label: "پروژه‌ها", icon: BriefcaseBusiness, count: 6 },
      { label: "مقالات وبلاگ", icon: FileText, count: 12 },
      { label: "مهارت‌ها", icon: Code2 },
      { label: "سوابق کاری", icon: Activity },
      { label: "زبان‌ها", icon: Globe2 },
    ],
  },
  {
    title: "مدیریت محتوا",
    items: [
      { label: "نظرات و بازخوردها", icon: MessageSquare, count: 3 },
      { label: "نظرسنجی‌ها", icon: Users },
      { label: "رسانه‌ها", icon: BookOpen },
    ],
  },
  {
    title: "تنظیمات",
    items: [
      { label: "مدیریت سایت", icon: Settings2 },
      { label: "کاربران و دسترسی‌ها", icon: ShieldCheck },
    ],
  },
];

const stats = [
  {
    label: "پروژه‌های منتشرشده",
    value: "۰۶",
    change: "+۲",
    detail: "نسبت به ماه قبل",
    icon: BriefcaseBusiness,
    tone: "purple",
  },
  {
    label: "مقالات وبلاگ",
    value: "۱۲",
    change: "+۳",
    detail: "نسبت به ماه قبل",
    icon: FileText,
    tone: "blue",
  },
  {
    label: "بازخوردهای جدید",
    value: "۰۳",
    change: "+۱",
    detail: "نیازمند بررسی",
    icon: MessageSquare,
    tone: "orange",
  },
  {
    label: "بازدیدکنندگان سایت",
    value: "۱٬۲۸۴",
    change: "+۱۲٪",
    detail: "نسبت به ماه قبل",
    icon: Activity,
    tone: "green",
  },
];

const activities = [
  {
    title: "یک مقاله جدید منتشر شد",
    description: "مقاله «آشنایی با React و مدیریت State»",
    time: "۲ ساعت پیش",
    icon: FileText,
    tone: "purple",
  },
  {
    title: "پروژه جدید اضافه شد",
    description: "پروژه طراحی داشبورد مدیریتی",
    time: "۵ ساعت پیش",
    icon: BriefcaseBusiness,
    tone: "blue",
  },
  {
    title: "بازخورد جدید دریافت شد",
    description: "یک پیام جدید از فرم تماس سایت",
    time: "دیروز",
    icon: MessageSquare,
    tone: "orange",
  },
  {
    title: "اطلاعات پروفایل به‌روزرسانی شد",
    description: "تغییرات در اطلاعات معرفی",
    time: "دیروز",
    icon: Users,
    tone: "green",
  },
];

function App() {
  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem("admin-active-page") ?? "داشبورد";
  });

  useEffect(() => {
    localStorage.setItem("admin-active-page", activePage);
  }, [activePage]);

  useEffect(() => {
    const savedScrollY = sessionStorage.getItem("admin-scroll-y");

    if (savedScrollY !== null) {
      window.scrollTo(0, Number(savedScrollY));
    }

    const saveScrollPosition = () => {
      sessionStorage.setItem("admin-scroll-y", String(window.scrollY));
    };

    window.addEventListener("scroll", saveScrollPosition, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", saveScrollPosition);
    };
  }, []);
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const pageTitle = activePage === "داشبورد" ? "نمای کلی" : activePage;

  return (
    <div
      className={`admin-app ${darkMode ? "theme-dark" : "theme-light"}`}
      dir="rtl">
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="بستن منو"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setActivePage("داشبورد");
            setSidebarOpen(false);
          }}>
          <span className="brand-mark">ML</span>
          <span className="brand-copy">
            <strong>MEHDI LEILAEI</strong>
            <small>پنل مدیریت شخصی</small>
          </span>
          <button
            className="icon-button sidebar-close"
            aria-label="بستن منو"
            onClick={(event) => {
              event.preventDefault();
              setSidebarOpen(false);
            }}>
            <X size={18} />
          </button>
        </a>

        <div className="sidebar-profile">
          <div className="profile-avatar">م</div>
          <div className="profile-copy">
            <strong>مهدی لیلایی</strong>
            <span>مدیر ارشد · Owner</span>
          </div>
          <span className="online-dot" />
        </div>

        <nav className="sidebar-nav" aria-label="منوی اصلی">
          {navigation.map((group) => (
            <div className="nav-group" key={group.title}>
              <p className="nav-heading">{group.title}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.label;

                return (
                  <button
                    key={item.label}
                    className={`nav-item ${active ? "nav-item-active" : ""}`}
                    onClick={() => {
                      setActivePage(item.label);
                      setSidebarOpen(false);
                    }}>
                    <Icon size={19} strokeWidth={1.8} />
                    <span>{item.label}</span>
                    {item.count !== undefined && (
                      <span className="nav-count">{item.count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom hidden">
          <div className="sidebar-help">
            <div className="help-icon">
              <ShieldCheck size={20} />
            </div>
            <strong>همه‌چیز تحت کنترل است</strong>
            <p>مدیریت محتوای سایت از یک نقطه</p>
            <span className="system-status">
              <span className="online-dot" />
              وضعیت پنل: آماده
            </span>
          </div>
          <div className="sidebar-footer">
            <span>نسخه ۱.۰.۰</span>
            <span>© ۲۰۲۶</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-start">
            <button
              className="icon-button mobile-menu"
              aria-label="باز کردن منو"
              onClick={() => setSidebarOpen(true)}>
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              <span>پنل مدیریت</span>
              <span className="breadcrumb-divider">/</span>
              <strong>{pageTitle}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جست‌وجو..."
                aria-label="جست‌وجو"
              />
              <kbd>⌘ K</kbd>
            </label>
            <button
              className="icon-button theme-toggle"
              aria-label={darkMode ? "فعال کردن تم روشن" : "فعال کردن تم تاریک"}
              title={darkMode ? "تم روشن" : "تم تاریک"}
              onClick={() => setDarkMode((current) => !current)}>
              {darkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="icon-button notification-button"
              aria-label="اعلان‌ها">
              <Bell size={19} />
              <span />
            </button>
            <div className="topbar-divider" />
            <button
              className="topbar-user"
              onClick={() => setActivePage("پروفایل")}>
              <span className="profile-avatar profile-avatar-small">م</span>
              <span className="topbar-user-copy">
                <strong>مهدی لیلایی</strong>
                <small>مدیر سیستم</small>
              </span>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                فضای کاری شما
              </div>
              <h1>
                {activePage === "داشبورد" ? "خوش اومدی، مهدی!" : activePage}
              </h1>
              <p className="page-subtitle">
                {activePage === "داشبورد"
                  ? "از اینجا می‌تونی وضعیت سایت و محتوای خودت رو مدیریت کنی."
                  : `بخش ${activePage} انتخاب شده است. اتصال امکانات این بخش در مراحل بعدی انجام می‌شود.`}
              </p>
            </div>
            <div className="welcome-actions">
              <button
                className="button-secondary"
                onClick={() => setDarkMode((current) => !current)}>
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
                تغییر تم
              </button>
              <button
                className="button-primary"
                onClick={() => setActivePage("مقالات وبلاگ")}>
                <Plus size={18} />
                محتوای جدید
              </button>
            </div>
          </section>

          {activePage === "داشبورد" ? (
            <>
              <section className="stats-grid" aria-label="آمار کلی">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <article className="stat-card" key={stat.label}>
                      <div className="stat-card-top">
                        <span className={`stat-icon tone-${stat.tone}`}>
                          <Icon size={21} strokeWidth={1.8} />
                        </span>
                        <button
                          className="stat-more"
                          aria-label={`اطلاعات ${stat.label}`}>
                          <ExternalLink size={15} />
                        </button>
                      </div>
                      <p className="stat-label">{stat.label}</p>
                      <div className="stat-value-row">
                        <strong className="stat-value">{stat.value}</strong>
                        <span className="stat-change">
                          <ArrowUpLeft size={14} />
                          {stat.change}
                        </span>
                      </div>
                      <p className="stat-detail">{stat.detail}</p>
                    </article>
                  );
                })}
              </section>

              <section className="content-grid">
                <article className="panel activity-panel">
                  <div className="panel-header">
                    <div>
                      <h2>فعالیت‌های اخیر</h2>
                      <p>آخرین تغییرات در فضای کاری شما</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setActivePage("مقالات وبلاگ")}>
                      مشاهده همه
                      <ArrowDownLeft size={16} />
                    </button>
                  </div>
                  <div className="activity-list">
                    {activities
                      .filter((activity) =>
                        `${activity.title} ${activity.description}`.includes(
                          search.trim(),
                        ),
                      )
                      .map((activity) => {
                        const Icon = activity.icon;
                        return (
                          <div className="activity-item" key={activity.title}>
                            <span
                              className={`activity-icon tone-${activity.tone}`}>
                              <Icon size={18} />
                            </span>
                            <div className="activity-copy">
                              <strong>{activity.title}</strong>
                              <p>{activity.description}</p>
                            </div>
                            <time>{activity.time}</time>
                          </div>
                        );
                      })}
                    {activities.filter((activity) =>
                      `${activity.title} ${activity.description}`.includes(
                        search.trim(),
                      ),
                    ).length === 0 && (
                      <p className="empty-search">
                        فعالیتی با این عبارت پیدا نشد.
                      </p>
                    )}
                  </div>
                </article>

                <article className="panel quick-panel">
                  <div className="panel-header">
                    <div>
                      <h2>دسترسی سریع</h2>
                      <p>کارهای پرکاربرد</p>
                    </div>
                  </div>
                  <div className="quick-actions">
                    <button onClick={() => setActivePage("مقالات وبلاگ")}>
                      <span className="quick-icon tone-purple">
                        <FileText size={19} />
                      </span>
                      <span>
                        <strong>مقاله جدید</strong>
                        <small>نوشتن و انتشار مقاله</small>
                      </span>
                      <ArrowDownLeft size={17} className="quick-arrow" />
                    </button>
                    <button onClick={() => setActivePage("پروژه‌ها")}>
                      <span className="quick-icon tone-blue">
                        <BriefcaseBusiness size={19} />
                      </span>
                      <span>
                        <strong>افزودن پروژه</strong>
                        <small>نمایش یک نمونه‌کار جدید</small>
                      </span>
                      <ArrowDownLeft size={17} className="quick-arrow" />
                    </button>
                    <button onClick={() => setActivePage("مدیریت سایت")}>
                      <span className="quick-icon tone-green">
                        <Settings2 size={19} />
                      </span>
                      <span>
                        <strong>تنظیمات سایت</strong>
                        <small>مدیریت ظاهر و محتوا</small>
                      </span>
                      <ArrowDownLeft size={17} className="quick-arrow" />
                    </button>
                    <button onClick={() => setActivePage("نظرات و بازخوردها")}>
                      <span className="quick-icon tone-orange">
                        <MessageSquare size={19} />
                      </span>
                      <span>
                        <strong>بررسی بازخوردها</strong>
                        <small>پیام‌های دریافتی</small>
                      </span>
                      <ArrowDownLeft size={17} className="quick-arrow" />
                    </button>
                  </div>
                </article>
              </section>

              <section className="bottom-banner">
                <div className="banner-art">
                  <div className="banner-orbit banner-orbit-one" />
                  <div className="banner-orbit banner-orbit-two" />
                  <div className="banner-monogram">ML</div>
                </div>
                <div className="banner-copy">
                  <span>MEHDI LEILAEI · PERSONAL PORTFOLIO</span>
                  <h2>فضای دیجیتال تو، با امضای خودت.</h2>
                  <p>
                    پروژه‌ها، مهارت‌ها و تجربه‌هایت را در یک فضای یکپارچه مدیریت
                    کن.
                  </p>
                </div>
                <button
                  className="banner-button"
                  onClick={() => setActivePage("مدیریت سایت")}>
                  تنظیمات سایت
                  <ArrowDownLeft size={17} />
                </button>
              </section>
            </>
          ) : (
            <section className="panel placeholder-panel">
              <span className="placeholder-icon">
                <Settings2 size={25} />
              </span>
              <h2>بخش {activePage}</h2>
              <p>
                پوستهٔ داشبورد آماده است. در مرحلهٔ بعد این بخش را به API واقعی
                متصل می‌کنیم.
              </p>
              <button
                className="button-primary"
                onClick={() => setActivePage("داشبورد")}>
                بازگشت به داشبورد
              </button>
            </section>
          )}

          <footer className="main-footer">
            <span>
              ساخته‌شده با تمرکز بر جزئیات{" "}
              <span className="footer-heart">♥</span>
            </span>
            <span>
              MEHDI LEILAEI <span className="footer-dot">·</span> ۲۰۲۶
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
