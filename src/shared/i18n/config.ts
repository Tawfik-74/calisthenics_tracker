import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Locale } from '@/shared/types/locale';

import commonEn from './common.en.json';
import commonAr from './common.ar.json';

/**
 * Base instance carries only the `common` namespace. Features register their
 * own namespaces via `registerNamespaces` from the composition root, so
 * `shared` never has to import `features`.
 */
export function initI18n(lng: Locale = 'en') {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      lng,
      fallbackLng: 'en',
      supportedLngs: ['en', 'ar'],
      ns: ['common'],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      resources: {
        en: { common: commonEn },
        ar: { common: commonAr },
      },
    });
  }
  return i18n;
}

export { i18n };
