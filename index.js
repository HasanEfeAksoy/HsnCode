const electron = require("electron");
const { ipcRenderer } = electron;
const fs = require("fs");
const path = require("path");
const { shell } = require("electron");




var width = window.innerWidth;
var height = window.innerHeight;

var newWidth = 200;
var menuTabLeft;
const textAreaContainer = document.getElementById("text-area-container");
const fileTree = document.getElementById("file-tree");


const currentEditingNameElement = document.getElementById("currentFile");
const currentEditingisSavedElement = document.getElementById("isSaved");
var currentFolderPath = '';
var currentEditingName = '';
var selectedFileParentPath = '';

var lastSavedText = "";
var currentText = "";
var previousText = "";
var currentEditingisSaved = true;

var undoStack = [];
var redoStack = [];
var ifRedoOrUndoThenUpdateLinesController = false;

var isBothScrollOpen = false;


// codeArea

const codeArea = document.getElementById("codeArea");
const codeAreaLines = document.getElementById("codeAreaLines");
var text = "";
var lines;
var lineCount = 1;
var prevLineCount = 1;

var selectedLine = 1;

let firstspanElement = document.createElement("span");
firstspanElement.innerHTML = (1).toString(); 
codeAreaLines.appendChild(firstspanElement);



function checkScroll() {
    const isVerticalScroll = codeArea.scrollHeight > codeArea.clientHeight;
    const isHorizontalScroll = codeArea.scrollWidth > codeArea.clientWidth;

    if (isVerticalScroll && isHorizontalScroll) {
        isBothScrollOpen = true;
        codeAreaLines.style.height = "calc(100% - 13.33px)";
    } 
    else {
        isBothScrollOpen = false;
        codeAreaLines.style.height = "100%";
    }
}

function lineSelectBold() {
    if (selectedLine <= lineCount) {
        codeAreaLines.children[selectedLine - 1].style.color = "#ffffff94";
    }    

    const selectionStart = codeArea.selectionStart;

    const linestoSelect = codeArea.value.substr(0, selectionStart).split(/\r|\r\n|\n/);
    const lineNumber = linestoSelect.length;

    selectedLine = lineNumber;

    if (selectedLine <= lineCount) {
        codeAreaLines.children[selectedLine - 1].style.color = "#00ffa694";
    }

}

function reloadLinesVars() {
    text = "";
    lineCount = 1;
    prevLineCount = 1;

    codeArea.value = '';
    codeAreaLines.innerHTML = '';

    let spanElement = document.createElement("span");
    spanElement.innerHTML = (1).toString(); 
    codeAreaLines.appendChild(spanElement);
} 
function updateLines() {
    text = codeArea.value;
    lines = text.split(/\r|\r\n|\n/);
    lineCount = lines.length;

    const fragment = document.createDocumentFragment();

    if (prevLineCount < lineCount) {
        for (let i = prevLineCount; i < lineCount; i++) {
            let spanElement = document.createElement("span");
            spanElement.innerHTML = (i+1).toString(); 
            fragment.appendChild(spanElement);
        }
        codeAreaLines.appendChild(fragment);
    }
    else if (prevLineCount > lineCount) {
        for (let i = prevLineCount; i > lineCount; i--) {
            codeAreaLines.removeChild(codeAreaLines.lastChild);
        }
    }

    prevLineCount = lineCount;
    
    checkScroll();



    if (!ifRedoOrUndoThenUpdateLinesController) {
        if (undoStack.length >= 20) {
            undoStack.shift();
        }
        undoStack.push(previousText);
        redoStack = [];
    }
    previousText = codeArea.value;



    currentText = codeArea.value;

    if (lastSavedText == currentText) {
        currentEditingisSaved = true;
    }
    else {
        // not saved
        currentEditingisSaved = false;
    }

    if (currentEditingisSaved) {
        currentEditingisSavedElement.innerHTML = "";
    }
    else {
        currentEditingisSavedElement.innerHTML = "*";
    }




    // if (currentEditingName.length >= 4) {
    //     let fileExtension = currentEditingName.substring(currentEditingName.length - 4, currentEditingName.length);
    //     if (fileExtension == ".cpp" || fileExtension == ".CPP" || fileExtension == ".CPp" || fileExtension == ".CpP" || fileExtension == ".Cpp" || fileExtension == ".cPP" || fileExtension == ".cPp" || fileExtension == ".cpP") {
        
    //     }
    // }



}

codeArea.addEventListener("input", (e) => {
    updateLines();
});
codeArea.addEventListener("scroll", (e) => {
    codeAreaLines.scrollTop = codeArea.scrollTop;
});


setInterval(() => {
    lineSelectBold();
}, 0);

codeArea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();

        const start = codeArea.selectionStart;
        const end = codeArea.selectionEnd;

        const tabCharacter = '    '; 
        codeArea.value = codeArea.value.substring(0, start) + tabCharacter + codeArea.value.substring(end);
        codeArea.selectionStart = codeArea.selectionEnd = start + tabCharacter.length;
    }
    else if ((e.key == "S" || e.key == "s") && e.ctrlKey) {
        if (currentFolderPath == '' || currentEditingName == '' || selectedFileParentPath == '') {
            file_saveas();
        }
        else {
            file_save();
        }
    }
    else if ((e.key == "Z" || e.key == "z") && e.ctrlKey) {
        e.preventDefault();
        edit_undo();

    }
    else if ((e.key == "Y" || e.key == "y") && e.ctrlKey) {
        e.preventDefault();
        edit_redo();
    }
    else if ((e.key == "X" || e.key == "x" && e.ctrlKey)) {
        e.preventDefault();
        edit_cut();
    }
    else if ((e.key == "C" || e.key == "c" && e.ctrlKey)) {
        e.preventDefault();
        edit_copy();
    }
    else if ((e.key == "V" || e.key == "v" && e.ctrlKey)) {
        e.preventDefault();
        edit_paste();
    }
    
    else if (e.key == "{") {
        codeHelper("}", 1);
    }
    else if (e.key == "(") {
        codeHelper(")", 1);
    }
    else if (e.key == "[") {
        codeHelper("]", 1);
    }
    else if (e.key == "\"") {
        codeHelper("\"", 1);
    }
    else if (e.key == "\'") {
        codeHelper("\'", 1);
    }

    else if (e.ctrlKey && e.key == " ") {
        e.preventDefault();
        codeHelper("#include <iostream>\n\nint main() {\n\n    return 0;\n}" , 0);
    }
    else if (e.ctrlKey && e.key == "!") {
        e.preventDefault();
        codeHelper('<!DOCTYPE html>\n<html lang="en">\n    <head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>Document</title>\n    </head>\n    <body>\n    \n    </body>\n</html>', 0);
    }

});

//


function codeHelper(duplicate, offset) {
    const cursorPos = codeArea.selectionStart;
    const currentValue = codeArea.value;

    const updatedValue = 
        currentValue.slice(0, cursorPos) +
        duplicate +
        currentValue.slice(cursorPos);
    
    codeArea.value = updatedValue;

    codeArea.focus();
    codeArea.setSelectionRange(cursorPos + duplicate.length - offset, cursorPos + duplicate.length - offset);
    
    updateLines();
}





// top bar main events

function menuTabAndCodeAreaResizing() {
    // fileTree.style.maxHeight = `${height - 66}px`;
    fileTree.style.maxHeight = `${height - 150}px`;
    textAreaContainer.style.left = `${menuTabLeft.getBoundingClientRect().width}px`;
    textAreaContainer.style.width = `${(width - menuTabLeft.getBoundingClientRect().width)}px`;
    textAreaContainer.style.height = `${(height - 35)}px`;
}




window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    
    if ((menuTabLeft.style.display != "none" || menuTabLeft.style.display != "") && newWidth <= 140 && newWidth >= width - 140) {
        menuTabLeft.style.width = `${200}px`;
        newWidth = 200;
    }

    menuTabAndCodeAreaResizing();
    
    document.querySelectorAll('.menu-left').forEach(menu => {
        menu.style.display = 'none';
    });
});
document.getElementById('minimize').addEventListener('click', () => {
    document.querySelectorAll('.menu-left').forEach(menu => {
        menu.style.display = 'none';
    });
    ipcRenderer.send('minimize-window');
});

document.getElementById('maximize').addEventListener('click', () => {
    document.querySelectorAll('.menu-left').forEach(menu => {
        menu.style.display = 'none';
    });
    ipcRenderer.send('maximize-window');

    width = window.innerWidth;
    height = window.innerHeight;

    if (menuTabLeft.style.display != "none" || menuTabLeft.style.display != "") {
        menuTabLeft.style.width = `${200}px`;
        newWidth = 200;
    }

    menuTabAndCodeAreaResizing();
});

document.getElementById('close').addEventListener('click', () => {
    document.querySelectorAll('.menu-left').forEach(menu => {
        menu.style.display = 'none';
    });
    if (!currentEditingisSaved) {
        if (ipcRenderer.sendSync("isConfirm", "The file was not saved. Are you sure you want to quit without saving? Your data will be deleted.")) {
            ipcRenderer.send('close-window');
        }
    }
    else {
        ipcRenderer.send('close-window');
    }
});

//








// top bar menu
const buttons = document.querySelectorAll('.title-bar-button-left');
buttons.forEach(button => {
    button.addEventListener('click', (event) => {
        const menuId = button.id + '-menu';
        const menu = document.getElementById(menuId);
        
        document.querySelectorAll('.menu-left').forEach(menu_ => {
            if (menu_ != menu) {
                menu_.style.display = 'none';
            }
        });

        if (menu) {
            if (menu.style.display == 'block') {
                menu.style.display = 'none';
            } else {
                menu.style.display = 'block';
            }
        }



        event.stopPropagation();
    });
});
document.addEventListener('click', (event) => {
    document.querySelectorAll('.menu-left').forEach(menu => {
        menu.style.display = 'none';
    });
});
//







// explorer menu

const explorerWithPath = document.getElementById("explorer+-selected-path");

const menuTabLeftResizeHandle = document.querySelector('.menu-tab-left-resize-handle');
menuTabLeft = document.querySelector('.menu-tab-left');
let isResizing = false;

menuTabLeft.style.width = `${200}px`;
menuTabAndCodeAreaResizing();

menuTabLeftResizeHandle.addEventListener('mousedown', (event) => {
    isResizing = true;
});
document.addEventListener('mousemove', (event) => {
    if (!isResizing) return;
    newWidth = event.clientX - menuTabLeft.getBoundingClientRect().left;
    if (newWidth > 140 && newWidth < width - 140) {
        menuTabLeft.style.width = `${newWidth}px`;
        menuTabAndCodeAreaResizing();
    }
});
document.addEventListener('mouseup', () => {
    isResizing = false;
});


//





//
// top bar menu functions
//






// file
function file_newfile() {
    if (!currentEditingisSaved) {
        if (ipcRenderer.sendSync("isConfirm", "The file was not saved. Are you sure you want to continue without saving? Your data will be deleted.")) {
            ipcRenderer.send("new-file");
        }
    }
    else {
        ipcRenderer.send("new-file");
    }
}
ipcRenderer.on("new-file-created", (event, fileName, folderPath) => {
    if (fileName != null && folderPath != null) {
        fileTree.innerHTML = '';
        currentFolderPath = folderPath;
        selectedFileParentPath = folderPath;
        currentEditingName = fileName;
        currentEditingNameElement.innerHTML = currentEditingName;
                
        explorerWithPath.innerHTML = "EXPLORER - " + currentFolderPath.toString();

        reloadLinesVars();
        updateLines();
        
        lastSavedText = currentText;
        currentEditingisSaved= true;
        currentEditingisSavedElement.innerHTML = "";

        createFileTree(currentFolderPath, fileTree);                
    }
});


function file_openfile() {
    if (!currentEditingisSaved) {
        if (ipcRenderer.sendSync("isConfirm", "The file was not saved. Are you sure you want to continue without saving? Your data will be deleted.")) {
            ipcRenderer.send("open-file");
        }
    }
    else {
        ipcRenderer.send("open-file");
    }
}
ipcRenderer.on("file-opened", (event, fileName, folderPath, data) => {
    if (fileName != null && folderPath != null) {
        fileTree.innerHTML = '';
        currentFolderPath = folderPath;
        currentEditingName = fileName;
        selectedFileParentPath = folderPath;
        currentEditingNameElement.innerHTML = currentEditingName;

        explorerWithPath.innerHTML = "EXPLORER - " + currentFolderPath.toString();

        reloadLinesVars();
        codeArea.value = (data).toString();
        updateLines();
        
        currentText = codeArea.value;
        lastSavedText = currentText;
        currentEditingisSaved= true;
        currentEditingisSavedElement.innerHTML = "";
        
        createFileTree(currentFolderPath, fileTree);   
    }
});


function file_openfolder() {
    if (!currentEditingisSaved) {
        if (ipcRenderer.sendSync("isConfirm", "The file was not saved. Are you sure you want to continue without saving? Your data will be deleted.")) {
            ipcRenderer.send("open-folder");
        }
    }
    else {
        ipcRenderer.send("open-folder");
    }
}
ipcRenderer.on("folder-selected", (event, folderPath) => {
    if (folderPath != null) {
        currentEditingName = '';
        selectedFileParentPath = '';
        currentEditingNameElement.innerHTML = "no selected file";

        currentFolderPath = folderPath;
        fileTree.innerHTML = '';
        explorerWithPath.innerHTML = "EXPLORER - " + currentFolderPath.toString();

        reloadLinesVars();
        codeArea.value = '';
        updateLines();

        currentText = '';
        lastSavedText = currentText;
        currentEditingisSaved= true;
        currentEditingisSavedElement.innerHTML = "";

        createFileTree(currentFolderPath, fileTree);   
    }
});


function file_save() {
    if (currentFolderPath != '' && currentEditingName != '' && selectedFileParentPath != '') {
        ipcRenderer.send("save", codeArea.value, currentEditingName, selectedFileParentPath);
    }
}
ipcRenderer.on("file-saved", (event, filePathForControl) => {
    if (!filePathForControl) {
    }
    else {
        lastSavedText = currentText;
        currentEditingisSaved= true;
        currentEditingisSavedElement.innerHTML = "";
    }
});



function file_saveas() {
    ipcRenderer.send("saveas", codeArea.value);
}
ipcRenderer.on("file-savedas", (event, fileName, folderPath) => {
    if (fileName != null && folderPath != null) {
        fileTree.innerHTML = '';
        currentFolderPath = folderPath;
        currentEditingName = fileName;
        selectedFileParentPath = folderPath;
        currentEditingNameElement.innerHTML = currentEditingName;

        lastSavedText = currentText;
        currentEditingisSaved= true;
        currentEditingisSavedElement.innerHTML = "";

        explorerWithPath.innerHTML = "EXPLORER - " + currentFolderPath.toString();

        createFileTree(currentFolderPath, fileTree);   
    }
});



function file_closefolder() {
    if (!currentEditingisSaved) {
        if (ipcRenderer.sendSync("isConfirm", "The file was not saved. Are you sure you want to continue without saving? Your data will be deleted.")) {
            currentFolderPath = '';
            currentEditingName = '';
            selectedFileParentPath = '';
            currentEditingNameElement.innerHTML = "no selected file";
            
            fileTree.innerHTML = '';
            
            explorerWithPath.innerHTML = "EXPLORER";

            reloadLinesVars();
            codeArea.value = '';
            updateLines();

            currentText = '';
            lastSavedText = currentText;
            currentEditingisSaved= true;
            currentEditingisSavedElement.innerHTML = "";
        }
    }
    else {
        currentFolderPath = '';
        currentEditingName = '';
        selectedFileParentPath = '';
        currentEditingNameElement.innerHTML = "no selected file";
        
        fileTree.innerHTML = '';
        
        explorerWithPath.innerHTML = "EXPLORER";

        reloadLinesVars();
        codeArea.value = '';
        updateLines();

        currentText = '';
        lastSavedText = currentText;
        currentEditingisSaved= true;
        currentEditingisSavedElement.innerHTML = "";
    }
}

function file_closewindow() {
    if (!currentEditingisSaved) {
        if (ipcRenderer.sendSync("isConfirm", "The file was not saved. Are you sure you want to continue without saving? Your data will be deleted.")) {
            ipcRenderer.send('close-window');
        }
    }
    else {
        ipcRenderer.send('close-window');
    }
}

//view
function view_reloadexplorer() {
    if (!currentEditingisSaved) {
        if (ipcRenderer.sendSync("isConfirm", "The file was not saved. Are you sure you want to continue without saving? Your data will be deleted.")) {
            currentEditingName = '';
            selectedFileParentPath = '';
            currentEditingNameElement.innerHTML = "no selected file";

            //currentFolderPath = folderPath;
            fileTree.innerHTML = '';
            explorerWithPath.innerHTML = "EXPLORER - " + currentFolderPath.toString();

            reloadLinesVars();
            codeArea.value = '';
            updateLines();

            currentText = '';
            lastSavedText = currentText;
            currentEditingisSaved= true;
            currentEditingisSavedElement.innerHTML = "";

            createFileTree(currentFolderPath, fileTree);   
        }
    }
    else {
        currentEditingName = '';
        selectedFileParentPath = '';
        currentEditingNameElement.innerHTML = "no selected file";

        //currentFolderPath = folderPath;
        fileTree.innerHTML = '';
        explorerWithPath.innerHTML = "EXPLORER - " + currentFolderPath.toString();

        reloadLinesVars();
        codeArea.value = '';
        updateLines();

        currentText = '';
        lastSavedText = currentText;
        currentEditingisSaved= true;
        currentEditingisSavedElement.innerHTML = "";

        createFileTree(currentFolderPath, fileTree); 
    }
}

function view_changeexplorertabstate() {
    if (menuTabLeft.style.display == "flex" || menuTabLeft.style.display == "") {
        menuTabLeft.style.width = `${0}px`;
        newWidth = 0;        
        menuTabLeft.style.display = "none";
        textAreaContainer.style.left = `${0}px`;
        textAreaContainer.style.width = `${(width)}px`;
    }
    else {
        menuTabLeft.style.display = "flex";
        menuTabLeft.style.width = `${200}px`;
        newWidth = 200;
        textAreaContainer.style.left = `${200}px`;
        textAreaContainer.style.width = `${(width - 200)}px`;
    }
}

function view_changecodecolor() {
    codeArea.style.color = document.getElementById("codeColorInput").value;
}


//edit
function edit_undo() {
    if (undoStack.length > 0) {
        redoStack.push(codeArea.value);
        const lastValue = undoStack.pop();
        codeArea.value = lastValue;
        ifRedoOrUndoThenUpdateLinesController = true;
        updateLines();
        ifRedoOrUndoThenUpdateLinesController = false;
    }
}
function edit_redo() {
    if (redoStack.length > 0) {
        undoStack.push(codeArea.value);
        const nextValue = redoStack.pop();
        codeArea.value = nextValue;
        ifRedoOrUndoThenUpdateLinesController = true;
        updateLines();
        ifRedoOrUndoThenUpdateLinesController = false;
    }
}
function edit_cut() {
    if (codeArea.value.substring(codeArea.selectionStart, codeArea.selectionEnd) === '') {
        const cursorPos = codeArea.selectionStart;
        let currentLineIndex = 0;
        let currentLineStart = 0;

        for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length + 1;
            if (currentLineStart + lineLength > cursorPos) {
                currentLineIndex = i;
                break;
            }
            currentLineStart += lineLength;
        }

        const lineToCopy = lines[currentLineIndex];

        lines.splice(currentLineIndex, 1);

        codeArea.value = lines.join('\n');
        
        updateLines();

        navigator.clipboard.writeText(lineToCopy + "\n");


        const newCursorPos = currentLineStart;
        codeArea.focus();
        codeArea.setSelectionRange(newCursorPos, newCursorPos);
    }
    else {
        const selectedText = codeArea.value.substring(codeArea.selectionStart, codeArea.selectionEnd);
        const start = codeArea.selectionStart;
        const end = codeArea.selectionEnd;

        const updatedValue = codeArea.value.slice(0, start) + codeArea.value.slice(end);
        codeArea.value = updatedValue;

        updateLines();

        navigator.clipboard.writeText(selectedText);

        codeArea.focus();
        codeArea.setSelectionRange(start, start);
    }
}
function edit_copy() {
    if (codeArea.value.substring(codeArea.selectionStart, codeArea.selectionEnd) === '') {
        const cursorPos = codeArea.selectionStart;
        let currentLineIndex = 0;
        let currentLineStart = 0;

        for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length + 1;
            if (currentLineStart + lineLength > cursorPos) {
                currentLineIndex = i;
                break;
            }
            currentLineStart += lineLength;
        }

        const lineToCopy = lines[currentLineIndex];

        updateLines();

        navigator.clipboard.writeText(lineToCopy + "\n");


        const newCursorPos = currentLineStart;
        codeArea.focus();
        codeArea.setSelectionRange(newCursorPos, newCursorPos);
    }
    else {
        const selectedText = codeArea.value.substring(codeArea.selectionStart, codeArea.selectionEnd);
        const start = codeArea.selectionStart;
        const end = codeArea.selectionEnd;

        updateLines();

        navigator.clipboard.writeText(selectedText);

        codeArea.focus();
    }
}
function edit_paste() {
    navigator.clipboard.readText().then(text => {
        const cursorPos = codeArea.selectionStart;
        
        const currentValue = codeArea.value;

        const updatedValue = 
            currentValue.slice(0, cursorPos) +
            text +
            currentValue.slice(cursorPos);
        
        codeArea.value = updatedValue;

        codeArea.focus();
        codeArea.setSelectionRange(cursorPos + text.length, cursorPos + text.length);
        
        updateLines();
    });
}



//help
function help_about() {
    shell.openExternal("https://hasanefeaksoy.com/about");
}
function help_documentation() {
    shell.openExternal("https://github.com/HasanEfeAksoy/HsnCode");
}


/////

















//
// explorer funcs
//



function createFileTree(dirPath, parentElement) {
    fs.readdir(dirPath, { withFileTypes: true }, (err, entries) => {
        if (err) {
            explorerWithPath.innerHTML = "EXPLORER";
            console.error("Klasör okunamadı:", err);

                
            // const filePath = path.join(__dirname, "ErrorLogHsnCode.txt");
            // const date = new Date().toLocaleString();
            // const content = "\nERROR TIME:\n\t" + date + "\n\nYour last content:\n{\n" + codeArea.value + "\n}\n";
            // fs.appendFile(filePath, content, (err) => {
            //     file_closewindow();
            // });
            
            return;
        }

        entries.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'file-tree-item';
            item.textContent = entry.name;

            // Sadece klasörler için ikonu ekle
            if (entry.isDirectory()) {
                const folderIcon = document.createElement('span');
                folderIcon.className = 'folder-icon';
                folderIcon.textContent = '▶'; // Başlangıçta kapalı ok simgesi
                item.prepend(folderIcon); // Ok simgesini klasör isminin soluna ekle

                const subTree = document.createElement('div');
                subTree.className = 'sub-tree';
                subTree.style.display = 'none'; // Başlangıçta gizli

                // Klasör açma/kapatma
                item.addEventListener('click', (event) => {
                    event.stopPropagation(); // Olayın yayılmasını engelle

                    document.querySelectorAll('.menu-left').forEach(menu => {
                        menu.style.display = 'none';
                    });

                    if (subTree.style.display === 'none') {
                        subTree.style.display = 'block'; // Göster
                        folderIcon.textContent = '▼'; // Açık ok simgesi
                        item.style.backgroundColor = '#404040'; // Klasör rengi
                        // Eğer alt ağaç daha önce oluşturulmadıysa yükle
                        if (subTree.children.length === 0) {
                            createFileTree(path.join(dirPath, entry.name), subTree); // Alt klasörleri yükle
                        }
                    } else {
                        // Kapatma işlemi: alt ağaç içeriğini temizle ya da commente al açılan açık dursun 
                        //subTree.innerHTML = ''; // İçeriği temizle
                        subTree.style.display = 'none'; // Gizle
                        folderIcon.textContent = '▶'; // Kapalı ok simgesi
                        item.style.backgroundColor = ''; // Klasör rengi sıfırla
                    }
                });
                

                item.appendChild(subTree); // Klasör altına ekle
                item.style.fontWeight = 'bold'; // Klasör adını kalın yap
            } else {
                // Dosya ise tıklanabilirlik ekleyin
                item.style.cursor = 'default';
                item.addEventListener('click', (event) => {
                    event.stopPropagation();

                    if (!currentEditingisSaved) {
                        if (ipcRenderer.sendSync("isConfirm", "The file was not saved. Are you sure you want to continue without saving? Your data will be deleted.")) {
                            ipcRenderer.send("open-file-when-click-the-file-in-the-explorer", entry.parentPath, entry.name);
                            
                            document.querySelectorAll('.menu-left').forEach(menu => {
                                menu.style.display = 'none';
                            });
                        
                            currentEditingName = entry.name;
                            currentEditingNameElement.innerHTML = currentEditingName;
                            selectedFileParentPath = entry.parentPath;
                        }
                    }
                    else {
                        ipcRenderer.send("open-file-when-click-the-file-in-the-explorer", entry.parentPath, entry.name);

                        document.querySelectorAll('.menu-left').forEach(menu => {
                            menu.style.display = 'none';
                        });
                    
                        currentEditingName = entry.name;
                        currentEditingNameElement.innerHTML = currentEditingName;
                        selectedFileParentPath = entry.parentPath;
                    }
                });
                
            }

            parentElement.appendChild(item); // Dosya veya klasörü ekle
        });
    });
}


ipcRenderer.on("open-file-when-click-the-file-in-the-explorer_end", (event, data) => {
    if (data != null) {    
        reloadLinesVars();
        codeArea.value = (data).toString();
        updateLines();

        currentText = codeArea.value;
        lastSavedText = currentText;
        currentEditingisSaved= true;
        currentEditingisSavedElement.innerHTML = "";
    }
    else {
        currentEditingName = '';
        selectedFileParentPath = '';
        currentEditingNameElement.innerHTML = "no selected file";

        fileTree.innerHTML = '';

        reloadLinesVars();
        codeArea.value = '';
        updateLines();

        currentText = '';
        lastSavedText = currentText;
        currentEditingisSaved= true;
        currentEditingisSavedElement.innerHTML = "";

        createFileTree(currentFolderPath, fileTree);
    }
});

// Başlangıçta klasörü yükle
/////////createFileTree(currentFolderPath, fileTree);