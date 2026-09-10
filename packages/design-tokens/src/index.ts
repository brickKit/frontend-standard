/**
 * 纯运行时 DOM 操作，零框架 import（PC 用 Vue3，移动端用 Uni-app，
 * 两边都能直接用）。持久化（写用户偏好接口/localStorage）不归这里管——
 * 那是 apps/pc、apps/mobile 各自的事，这个包只负责"把值真的应用到 DOM"。
 */

export type ThemeMode = "light" | "dark" | "system";
export type Density = "comfortable" | "compact";

const THEME_ATTR = "data-theme";
const DENSITY_ATTR = "data-density";

function prefersDark(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  return mode === "system" ? (prefersDark() ? "dark" : "light") : mode;
}

let systemListenerCleanup: (() => void) | undefined;

/** 把主题应用到 <html>。mode="system" 时会订阅系统偏好变化，返回值是取消订阅函数。 */
export function applyTheme(mode: ThemeMode, root: HTMLElement = document.documentElement): () => void {
  systemListenerCleanup?.();
  systemListenerCleanup = undefined;

  root.setAttribute(THEME_ATTR, resolveTheme(mode));

  if (mode === "system" && typeof window !== "undefined" && typeof window.matchMedia === "function") {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => root.setAttribute(THEME_ATTR, resolveTheme("system"));
    mql.addEventListener("change", handler);
    systemListenerCleanup = () => mql.removeEventListener("change", handler);
  }

  return () => systemListenerCleanup?.();
}

export function applyDensity(density: Density, root: HTMLElement = document.documentElement): void {
  root.setAttribute(DENSITY_ATTR, density);
}

export function getAppliedTheme(root: HTMLElement = document.documentElement): "light" | "dark" | null {
  return root.getAttribute(THEME_ATTR) as "light" | "dark" | null;
}

export function getAppliedDensity(root: HTMLElement = document.documentElement): Density | null {
  return root.getAttribute(DENSITY_ATTR) as Density | null;
}
