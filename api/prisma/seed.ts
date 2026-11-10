import 'dotenv/config';
import { Language, Prisma, PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type LanguageKey = 'fa' | 'en' | 'ar';

const languages = [
  { key: 'fa', language: Language.fa },
  { key: 'en', language: Language.en },
  { key: 'ar', language: Language.ar },
] as const;

const navigationItems = [
  {
    key: 'home',
    href: '/',
    sortOrder: 1,
    labels: {
      fa: 'خانه',
      en: 'Home',
      tr: 'Ana Sayfa',
      ar: 'الرئيسية',
    },
  },
  {
    key: 'about',
    href: '/about',
    sortOrder: 2,
    labels: {
      fa: 'درباره من',
      en: 'About',
      tr: 'Hakkımda',
      ar: 'من أنا',
    },
  },
  {
    key: 'projects',
    href: '/projects',
    sortOrder: 3,
    labels: {
      fa: 'پروژه‌ها',
      en: 'Projects',
      tr: 'Projeler',
      ar: 'المشاريع',
    },
  },
  {
    key: 'skills',
    href: '/skills',
    sortOrder: 4,
    labels: {
      fa: 'مهارت‌ها',
      en: 'Skills',
      tr: 'Yetenekler',
      ar: 'المهارات',
    },
  },
  {
    key: 'contact',
    href: '/contact',
    sortOrder: 5,
    labels: {
      fa: 'ارتباط با من',
      en: 'Contact',
      tr: 'İletişim',
      ar: 'تواصل معي',
    },
  },
] as const;

const homeSections: {
  key: string;
  type: string;
  sortOrder: number;
  translations: Record<
    LanguageKey,
    {
      title: string;
      subtitle: string;
      description: string;
    }
  >;
}[] = [
  {
    key: 'hero',
    type: 'hero',
    sortOrder: 0,
    translations: {
      fa: {
        title: 'سلام، من مهدی لیلایی هستم',
        subtitle: 'توسعه‌دهنده وب و طراح رابط کاربری',
        description:
          'توسعه‌دهنده فرانت‌اند با React و Next.js و بک‌اند با NestJS.',
      },
      en: {
        title: "Hi, I'm Mehdi Leilaei",
        subtitle: 'Web Developer & UI Designer',
        description:
          'Frontend developer with React and Next.js, and backend developer with NestJS.',
      },
      ar: {
        title: 'مرحباً، أنا مهدي ليلايي',
        subtitle: 'مطور ويب ومصمم واجهات المستخدم',
        description:
          'مطور واجهات أمامية باستخدام React وNext.js ومطور خلفيات باستخدام NestJS.',
      },
    },
  },
  {
    key: 'about',
    type: 'about',
    sortOrder: 1,
    translations: {
      fa: {
        title: 'درباره من',
        subtitle: 'علاقه‌مند به ساخت محصولات دیجیتال',
        description:
          'من توسعه‌دهنده وب هستم و روی طراحی و پیاده‌سازی اپلیکیشن‌های مدرن تمرکز دارم.',
      },
      en: {
        title: 'About Me',
        subtitle: 'Passionate about building digital products',
        description:
          'I am a web developer focused on designing and building modern applications.',
      },
      ar: {
        title: 'نبذة عني',
        subtitle: 'شغوف ببناء المنتجات الرقمية',
        description: 'أنا مطور ويب أركز على تصميم وبناء التطبيقات الحديثة.',
      },
    },
  },
  {
    key: 'projects',
    type: 'projects',
    sortOrder: 2,
    translations: {
      fa: {
        title: 'پروژه‌های من',
        subtitle: 'نمونه‌ای از تجربه‌ها و دستاوردهای من',
        description:
          'در این بخش می‌توانید پروژه‌های توسعه وب من را مشاهده کنید.',
      },
      en: {
        title: 'My Projects',
        subtitle: 'A selection of my work and achievements',
        description:
          'Explore some of my web development projects in this section.',
      },
      ar: {
        title: 'مشاريعي',
        subtitle: 'مجموعة من أعمالي وإنجازاتي',
        description:
          'يمكنك استكشاف بعض مشاريع تطوير الويب الخاصة بي في هذا القسم.',
      },
    },
  },
];

const siteSettings: {
  key: string;
  values: Record<LanguageKey, Prisma.InputJsonObject>;
}[] = [
  {
    key: 'site',
    values: {
      fa: {
        title: 'مهدی لیلایی | توسعه‌دهنده وب',
        description: 'پورتفولیوی شخصی مهدی لیلایی',
      },
      en: {
        title: 'Mehdi Leilaei | Web Developer',
        description: "Mehdi Leilaei's personal portfolio",
      },
      ar: {
        title: 'مهدي ليلايي | مطور ويب',
        description: 'الموقع الشخصي لمهدي ليلايي',
      },
    },
  },
  {
    key: 'contact',
    values: {
      fa: {
        email: null,
        phone: null,
        location: null,
      },
      en: {
        email: null,
        phone: null,
        location: null,
      },
      ar: {
        email: null,
        phone: null,
        location: null,
      },
    },
  },
  {
    key: 'seo',
    values: {
      fa: {
        title: 'مهدی لیلایی | توسعه‌دهنده وب',
        description: 'پورتفولیوی شخصی مهدی لیلایی',
        keywords: [
          'مهدی لیلایی',
          'توسعه‌دهنده وب',
          'React',
          'Next.js',
          'NestJS',
        ],
      },
      en: {
        title: 'Mehdi Leilaei | Web Developer',
        description: 'Personal portfolio of Mehdi Leilaei',
        keywords: [
          'Mehdi Leilaei',
          'Web Developer',
          'React',
          'Next.js',
          'NestJS',
        ],
      },
      ar: {
        title: 'مهدي ليلايي | مطور ويب',
        description: 'الموقع الشخصي لمهدي ليلايي',
        keywords: ['مهدي ليلايي', 'مطور ويب', 'React', 'Next.js', 'NestJS'],
      },
    },
  },
  {
    key: 'footer',
    values: {
      fa: {
        copyright: '© مهدی لیلایی',
        description: '',
      },
      en: {
        copyright: '© Mehdi Leilaei',
        description: '',
      },
      ar: {
        copyright: '© مهدي ليلايي',
        description: '',
      },
    },
  },
];

async function seedNavigation() {
  await prisma.navigationMenu.upsert({
    where: { key: 'main' },
    create: {
      key: 'main',
      title: 'Main Navigation',
      location: 'header',
      enabled: true,
    },
    update: {
      title: 'Main Navigation',
      location: 'header',
      enabled: true,
    },
  });

  const menu = await prisma.navigationMenu.findUniqueOrThrow({
    where: { key: 'main' },
  });

  for (const itemData of navigationItems) {
    const item = await prisma.navigationItem.upsert({
      where: {
        menuId_key: {
          menuId: menu.id,
          key: itemData.key,
        },
      },
      create: {
        menuId: menu.id,
        key: itemData.key,
        href: itemData.href,
        sortOrder: itemData.sortOrder,
        external: false,
        enabled: true,
      },
      update: {
        href: itemData.href,
        sortOrder: itemData.sortOrder,
        enabled: true,
      },
    });

    for (const { key, language } of [
      ...languages,
      { key: 'tr', language: Language.tr },
    ]) {
      await prisma.navigationItemTranslation.upsert({
        where: {
          itemId_language: {
            itemId: item.id,
            language,
          },
        },
        create: {
          itemId: item.id,
          language,
          label: itemData.labels[key],
        },
        update: {
          label: itemData.labels[key],
        },
      });
    }
  }

  console.log('Navigation seeded successfully.');
}

async function seedHomeSections() {
  for (const sectionData of homeSections) {
    const section = await prisma.pageSection.upsert({
      where: { key: sectionData.key },
      create: {
        key: sectionData.key,
        type: sectionData.type,
        enabled: true,
        sortOrder: sectionData.sortOrder,
      },
      update: {},
    });

    for (const { key, language } of languages) {
      const translation = sectionData.translations[key];

      await prisma.pageSectionTranslation.upsert({
        where: {
          sectionId_language: {
            sectionId: section.id,
            language,
          },
        },
        create: {
          sectionId: section.id,
          language,
          title: translation.title,
          subtitle: translation.subtitle,
          description: translation.description,
        },
        update: {},
      });
    }
  }

  console.log('Home sections seeded successfully.');
}

async function seedSiteSettings() {
  for (const settingData of siteSettings) {
    const setting = await prisma.siteSettings.upsert({
      where: { key: settingData.key },
      create: {
        key: settingData.key,
        value: settingData.values.fa,
      },
      update: {},
    });

    for (const { key, language } of languages) {
      await prisma.siteSettingsTranslation.upsert({
        where: {
          settingsId_language: {
            settingsId: setting.id,
            language,
          },
        },
        create: {
          settingsId: setting.id,
          language,
          value: settingData.values[key],
        },
        update: {},
      });
    }
  }

  console.log('Site settings seeded successfully.');
}

async function main() {
  await seedNavigation();
  await seedHomeSections();
  await seedSiteSettings();

  console.log('Database seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
