const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pet', {
  onTick: (cb) => ipcRenderer.on('tick', (_e, d) => cb(d)),
  onForm: (cb) => ipcRenderer.on('form', (_e, d) => cb(d)),
  dragStart: () => ipcRenderer.send('drag-start'),
  dragEnd: () => ipcRenderer.send('drag-end'),
  react: () => ipcRenderer.send('react'),
  openSettings: () => ipcRenderer.send('open-settings'),
});
