window.__stashPendingShares = window.__stashPendingShares || [];
window.median_share_to_app = function (data) { window.__stashPendingShares.push(data); };
if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () { /* The vault still works when offline installation is unavailable. */ }); });
}
