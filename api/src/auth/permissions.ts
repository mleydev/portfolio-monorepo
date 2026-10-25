export const ADMIN_PERMISSIONS = [
  'projects',
  'blog',
  'experience',
  'skills',
  'language-skills',
  'profile',
  'navigation',
  'site-management',
  'media',
  'feedback',
  'polls',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];
