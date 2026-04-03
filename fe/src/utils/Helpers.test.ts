import { describe, expect, it } from 'vitest';
import { getI18nPath } from './Helpers';

describe('Helpers', () => {
  describe('getI18nPath function', () => {
    it('should not change the path for default language', () => {
      const url = '/random-url';
      const locale = 'en';

      expect(getI18nPath(url, locale)).toBe(url);
    });

    it('should keep the path unchanged even when a locale is passed', () => {
      const url = '/random-url';
      const locale = 'fr';

      expect(getI18nPath(url, locale)).toBe(url);
    });
  });
});
