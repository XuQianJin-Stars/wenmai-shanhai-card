// 全屏。桌面浏览器、Android 和 iPadOS 有 Fullscreen API；iPhone 的 Safari 至今没有（微信、
// 抖音等内置浏览器同理），那边唯一能真全屏的办法是「添加到主屏幕」后从图标启动，所以
// canFullscreen() 为假时界面上给的是指引而不是按钮。
const root = document.documentElement;
const enter = root.requestFullscreen ?? root.webkitRequestFullscreen;
const leave = document.exitFullscreen ?? document.webkitExitFullscreen;

export const canFullscreen = () => !!enter;
export const isFullscreen = () => !!(document.fullscreenElement ?? document.webkitFullscreenElement);

/** 从主屏幕图标以独立窗口启动的，本来就没有浏览器外壳。 */
export const standalone = () =>
  navigator.standalone === true || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;

/** 必须在用户手势里调用，否则浏览器会拒绝。失败只返回 false，不抛错。 */
export async function requestFullscreen() {
  if (!enter) return false;
  if (isFullscreen()) return true;
  try {
    await enter.call(root, { navigationUI: 'hide' });
  } catch {
    return false;
  }
  // 方向锁定只有全屏时才允许，且 iOS 一律拒绝——锁不上也无所谓，还有横屏提示兜底。
  try { await screen.orientation?.lock?.('landscape'); } catch { /* 不支持 */ }
  return true;
}

export async function exitFullscreen() {
  try { await leave?.call(document); } catch { /* 已经退出了 */ }
}

export const toggleFullscreen = () => (isFullscreen() ? exitFullscreen() : requestFullscreen());

export function onFullscreenChange(fn) {
  document.addEventListener('fullscreenchange', fn);
  document.addEventListener('webkitfullscreenchange', fn);
}
