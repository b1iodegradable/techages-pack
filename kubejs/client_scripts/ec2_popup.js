// Enhanced Celestials 6.0.2.6 при каждом входе в мир показывает рекламу EC2 (для 1.21.1 её нет), отключить в конфиге нельзя.
// Закрываем это окно, как только оно открылось.
var $EC2Announcement = null
try { $EC2Announcement = Java.loadClass('dev.corgitaco.enhancedcelestials.client.gui.EC2AnnouncementScreen') } catch (err) { console.warn(`ec2_popup: ${err}`) }

ClientEvents.tick(e => {
  if (!$EC2Announcement || !Client.screen) return
  if (Client.screen instanceof $EC2Announcement) Client.setScreen(null)
})
