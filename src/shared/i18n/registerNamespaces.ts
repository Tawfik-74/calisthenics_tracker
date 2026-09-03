import { i18n } from './config';

export interface NamespaceBundle {
  ns: string;
  en: Record<string, unknown>;
  ar: Record<string, unknown>;
}

/** Called once from the composition root with every feature's i18n bundle. */
export function registerNamespaces(bundles: NamespaceBundle[]) {
  for (const { ns, en, ar } of bundles) {
    i18n.addResourceBundle('en', ns, en, true, true);
    i18n.addResourceBundle('ar', ns, ar, true, true);
  }
}
