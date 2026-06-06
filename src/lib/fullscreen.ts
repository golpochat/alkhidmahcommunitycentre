export function isFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.fullscreenElement);
}

export async function requestFullscreen(): Promise<void> {
  if (typeof document === "undefined") return;
  const element = document.documentElement;
  if (element.requestFullscreen) {
    await element.requestFullscreen();
    return;
  }
  const legacy = element as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  if (legacy.webkitRequestFullscreen) {
    await legacy.webkitRequestFullscreen();
  }
}

export async function exitFullscreen(): Promise<void> {
  if (typeof document === "undefined") return;
  if (document.exitFullscreen) {
    await document.exitFullscreen();
    return;
  }
  const legacy = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
  };
  if (legacy.webkitExitFullscreen) {
    await legacy.webkitExitFullscreen();
  }
}
