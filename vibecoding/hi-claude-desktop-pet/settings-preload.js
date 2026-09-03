const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cfg', {
  get: () => ipcRenderer.invoke('settings:get'),
  set: (s) => ipcRenderer.send('settings:set', s),
  prevForm: () => ipcRenderer.send('form:prev'),
  nextForm: () => ipcRenderer.send('form:next'),
  randomForm: () => ipcRenderer.send('form:random'),
  quit: () => ipcRenderer.send('app:quit'),
});
