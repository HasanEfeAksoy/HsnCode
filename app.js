const electron = require("electron");
const url = require("url");
const path = require("path");
const { app, BrowserWindow, ipcMain, dialog } = electron;

const fs = require("fs");
const { shell } = require("electron");




app.on("ready", () => {
    const mainWindow = new BrowserWindow({
        webPreferences:{
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },

        width: 1200,
        height: 600,
        minWidth: 400,
        minHeight: 400,
        backgroundColor: "#202020",
        frame: false,
    });
    mainWindow.loadURL(
        url.format(
            {
                pathname : path.join(__dirname, "index.html"),
                protocol : "file",
                slashes : true
            }
        )
    );









    // file

    ipcMain.on("new-file", async (event) => {
        const result = await dialog.showSaveDialog({
            title: 'Create a New File',
            buttonLabel: 'Save',
            filters: [
                { name: 'All Files', extensions: ['*'] },
                // { name: 'Text Files', extensions: ['txt'] },
                // { name: 'Hasanbly Files', extensions: ['hsn'] },
                // { name: 'C++ Files', extensions: ['cpp'] },
                // { name: 'C++ Files', extensions: ['c++'] },
                // { name: 'Python Files', extensions: ['py'] },
                // { name: 'JavaScript Files', extensions: ['js'] },
                // { name: 'C# Files', extensions: ['cs'] },
                // { name: 'Java Files', extensions: ['java'] },
                // { name: 'HTML Files', extensions: ['html'] },
                // { name: 'CSS Files', extensions: ['css'] },
                // { name: 'Assembly Files', extensions: ['asm'] },
                // { name: 'Assembly Files', extensions: ['s'] },
                // { name: 'Ruby Files', extensions: ['ru'] },
                // { name: 'PHP Files', extensions: ['php'] },
                // { name: 'EJS Files', extensions: ['ejs'] },
                // { name: 'JSON Files', extensions: ['json'] },
                // { name: 'XML Files', extensions: ['xml'] },
                // { name: 'Batch Files', extensions: ['bat'] },
                // { name: 'Bash Files', extensions: ['sh'] }
            ]
        });
    
        if (!result.canceled) {
            const filePath = result.filePath;
            const fileName = path.basename(filePath);
            const folderPath = path.dirname(filePath);
    
            fs.writeFile(filePath, '', (err) => {
                if (err) {
                    event.reply('new-file-created', null);
                } else {
                    event.reply('new-file-created', fileName, folderPath);
                }
            });
        }
        else {
            event.reply('new-file-created', null);
        }

    });


    ipcMain.on('open-file', async (event) => {
        const result = await dialog.showOpenDialog({
            title: 'Select File',
            properties: ['openFile'],
            filters: [
                { name: 'All Files', extensions: ['*'] },
                // { name: 'Text Files', extensions: ['txt'] },
                // { name: 'Hasanbly Files', extensions: ['hsn'] },
                // { name: 'C++ Files', extensions: ['cpp'] },
                // { name: 'C++ Files', extensions: ['c++'] },
                // { name: 'Python Files', extensions: ['py'] },
                // { name: 'JavaScript Files', extensions: ['js'] },
                // { name: 'C# Files', extensions: ['cs'] },
                // { name: 'Java Files', extensions: ['java'] },
                // { name: 'HTML Files', extensions: ['html'] },
                // { name: 'CSS Files', extensions: ['css'] },
                // { name: 'Assembly Files', extensions: ['asm'] },
                // { name: 'Assembly Files', extensions: ['s'] },
                // { name: 'Ruby Files', extensions: ['ru'] },
                // { name: 'PHP Files', extensions: ['php'] },
                // { name: 'EJS Files', extensions: ['ejs'] },
                // { name: 'JSON Files', extensions: ['json'] },
                // { name: 'XML Files', extensions: ['xml'] },
                // { name: 'Batch Files', extensions: ['bat'] },
                // { name: 'Bash Files', extensions: ['sh'] }
            ],
        });
    
        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            const fileName = path.basename(filePath);
            const folderPath = path.dirname(filePath);
    
            fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err) {
                    event.reply('file-opened', null);
                } else {
                    event.reply('file-opened', fileName, folderPath, data);
                }
            });
        }
        else {
            event.reply('file-opened', null);
        }
    });


    ipcMain.on("open-folder", async (event) => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });

        if (!result.canceled) {
            event.sender.send('folder-selected', result.filePaths[0]);
        }
        else {
            event.sender.send('folder-selected', null);
        }
    });


    ipcMain.on("save", async (event, content, fileName_, folderPath_) => {
        const filePath = path.join(folderPath_, fileName_);

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                fs.writeFile(filePath, content, (writeErr) => {
                    if (writeErr) {
                        event.reply('file-saved', null);
                    } else {
                        event.reply('file-saved', filePath);
                    }
                });
            } else {
                fs.writeFile(filePath, content, (writeErr) => {
                    if (writeErr) {
                        event.reply('file-saved', null);
                    } else {
                        event.reply('file-saved', filePath);
                    }
                });
            }
        });
    });


    ipcMain.on("saveas", async (event, content) => {
        const result = await dialog.showSaveDialog({
            title: 'Save as File',
            buttonLabel: 'Save',
            filters: [
                { name: 'All Files', extensions: ['*'] },
                // { name: 'Text Files', extensions: ['txt'] },
                // { name: 'Hasanbly Files', extensions: ['hsn'] },
                // { name: 'C++ Files', extensions: ['cpp'] },
                // { name: 'C++ Files', extensions: ['c++'] },
                // { name: 'Python Files', extensions: ['py'] },
                // { name: 'JavaScript Files', extensions: ['js'] },
                // { name: 'C# Files', extensions: ['cs'] },
                // { name: 'Java Files', extensions: ['java'] },
                // { name: 'HTML Files', extensions: ['html'] },
                // { name: 'CSS Files', extensions: ['css'] },
                // { name: 'Assembly Files', extensions: ['asm'] },
                // { name: 'Assembly Files', extensions: ['s'] },
                // { name: 'Ruby Files', extensions: ['ru'] },
                // { name: 'PHP Files', extensions: ['php'] },
                // { name: 'EJS Files', extensions: ['ejs'] },
                // { name: 'JSON Files', extensions: ['json'] },
                // { name: 'XML Files', extensions: ['xml'] },
                // { name: 'Batch Files', extensions: ['bat'] },
                // { name: 'Bash Files', extensions: ['sh'] }
            ]
        });
    
        if (!result.canceled && result.filePath) {
            const filePath = result.filePath;
            const fileName = path.basename(filePath);
            const folderPath = path.dirname(filePath);
            
            fs.writeFile(filePath, content, (err) => {
                if (err) {
                    event.reply('file-savedas', null);
                } else {
                    event.reply('file-savedas', fileName, folderPath);
                }
            });
        } else {
            event.reply('file-savedas', null);
        }
    });

    // edit

    // view

    // help
    







    



    // explorer


    ipcMain.on("open-file-when-click-the-file-in-the-explorer", async (event, folder_path, file_name) => {
        const filePath = path.join(folder_path, file_name);
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                event.reply("open-file-when-click-the-file-in-the-explorer_end", null);
            } 
            else {
                event.reply("open-file-when-click-the-file-in-the-explorer_end", data);
            }
        });
    });
    



    // top bar main events



    ipcMain.on('minimize-window', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        win.minimize();
    });
    ipcMain.on('maximize-window', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    });
    ipcMain.on('close-window', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        win.close();
    });







    // confirm


    ipcMain.on('isConfirm', (event, message) => {
        const result = dialog.showMessageBoxSync(mainWindow, {
            type: 'question',
            buttons: ['No', 'Yes'],
            title: 'Confirmation',
            message: message,
        });

        event.returnValue = (result === 1);
    });


});