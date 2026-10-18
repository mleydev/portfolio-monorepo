import 'dotenv/config';
import { PrismaClient, Language } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

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

async function main() {
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

    const labels = itemData.labels;

    const translations: { language: Language; label: string }[] = [
      { language: Language.fa, label: labels.fa },
      { language: Language.en, label: labels.en },
      { language: Language.tr, label: labels.tr },
      { language: Language.ar, label: labels.ar },
    ];

    for (const translation of translations) {
      await prisma.navigationItemTranslation.upsert({
        where: {
          itemId_language: {
            itemId: item.id,
            language: translation.language,
          },
        },
        create: {
          itemId: item.id,
          language: translation.language,
          label: translation.label,
        },
        update: {
          label: translation.label,
        },
      });
    }
  }

  console.log('Main navigation seeded successfully.');
}

main()
  .catch((error) => {
    console.error('Failed to seed navigation:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
