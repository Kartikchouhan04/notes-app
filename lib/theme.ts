export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "thought-vault-theme";

/**
 * Injected into <head> so the stored theme is applied before first paint.
 * Lives outside the client component so the server layout can import the raw string.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', stored || (prefersDark ? 'dark' : 'light'));
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;
