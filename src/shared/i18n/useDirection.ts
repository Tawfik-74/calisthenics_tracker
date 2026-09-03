import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export type Direction = 'ltr' | 'rtl';

/** RTL is a layout property, not a translation problem. */
export function useDirection(): Direction {
  const { i18n } = useTranslation();
  const dir: Direction = i18n.language.startsWith('ar') ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [dir, i18n.language]);

  return dir;
}
