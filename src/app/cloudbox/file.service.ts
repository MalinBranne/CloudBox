import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { IFile, FileType, FileState } from './constants';

const Dropbox = require('dropbox').Dropbox;
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter'; //? kan nog tas bort, test size formating
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { DomSanitizer } from '@angular/platform-browser';

// Firebase
import * as firebase from 'firebase';
firebase.initializeApp({
  // Info found in Firebase console, get started
  apiKey: "AIzaSyCN4CfLZv9feveBxQR2p00hqp7U_n64db0",
  authDomain: "cloudbox-b8737.firebaseapp.com",
  databaseURL: "https://cloudbox-b8737.firebaseio.com/",
  storageBucket: "cloudbox-b8737.appspot.com"
});

@Injectable()
export class FileService {


  fileState: FileState = {
    paths: {},
    currentPath: "",
    preview: {
      data: "Nothing To Preview",
      type: "default"
    },
    loading: false,
    selectedFile: null,
    error: null
  };

  subject = new BehaviorSubject(this.fileState);

  starredFiles: IFile[] = [];
  cursor;

  dbx = new Dropbox({ clientId: this.authService.CLIENT_ID, accessToken: this.authService.ACCESS_TOKEN });
  databaseRef;

  //----------------------------------------
  // Constructor
  //----------------------------------------
  constructor(private authService: AuthService, private sanitizer: DomSanitizer) {

    // Create or sync starred files in local storage for current user
    if (!localStorage.getItem("starredFiles" + this.authService.USER_ID)) {
      localStorage.setItem("starredFiles" + this.authService.USER_ID, JSON.stringify(this.starredFiles));
    }
    this.starredFiles = JSON.parse(localStorage.getItem("starredFiles" + this.authService.USER_ID));

    this.getDropboxCursor()
      .then(cursor => {

        this.cursor = cursor;

        // Subscribe to firebase database
        this.databaseRef = firebase.database().ref(`modifiedDropbox/${this.authService.USER_ID}`);
        this.databaseRef.on("value", snapshot => {

          const wasModified = snapshot.val();
          // Check if there are changes to dropbox database
          if (wasModified) {

            // Get modified files
            this.dbx.filesListFolderContinue({ cursor: this.cursor })
              .then(response => {
                // Save relevant info
                const changedFiles = response.entries;

                // Categorize incoming files
                let newFiles = [], deletedFiles = [];
                for (let changedFile of changedFiles) {
                  if (changedFile[".tag"] === "deleted")
                    deletedFiles.push(changedFile);
                  else
                    newFiles.push(changedFile);
                }

                // Do stuff for new or modified files
                for (let newFile of newFiles) {
                  const filePath = newFile["path_display"];
                  const folderPath = this.getFolderPath(filePath);

                  // Check if cached parent folder exists
                  if (this.fileState.paths[folderPath]) {

                    // See if it is a modified file
                    const posModified = this.fileState.paths[folderPath].findIndex(file => {
                      return file.id === newFile.id;
                    });

                    newFile = this.constructFile(newFile);

                    // Store the new entry in cache
                    if (posModified === -1) { // New file
                      this.fileState.paths[folderPath].push(newFile);
                    }
                    else { // Modified file
                      this.fileState.paths[folderPath][posModified] = newFile;
                    }

                    // Update possible entry in starred files
                    if (newFile.starred)
                      this.updateStarredFile(newFile);
                  }
                  // Cached parent folder didn't exist, but check for entry in starred files
                  else {
                    const isStarred = this.starredFiles.find(f => f.id === newFile.id) ? true : false;
                    if (isStarred) {
                      newFile = this.constructFile(newFile);
                      this.updateStarredFile(newFile);
                    }
                  }
                }

                // Do stuff for deleted files
                for (let deletedFile of deletedFiles) {
                  const filePath = deletedFile["path_display"];
                  const folderPath = this.getFolderPath(filePath);

                  // Check if cached parent folder exists
                  if (this.fileState.paths[folderPath]) {

                    // Remove entry
                    this.fileState.paths[folderPath] = this.fileState.paths[folderPath]
                      .filter(file => file.name !== deletedFile.name);

                    // Remove path, if exists (for folder)
                    delete this.fileState.paths[filePath];

                    // Redirect to root folder if in deleted folder 
                    if (this.fileState.currentPath === filePath) {
                      this.fileState.currentPath = "";
                    }
                  }

                  // Remove a possible entry in starred files
                  this.updateStarredFile(deletedFile, true);
                }

                this.updateSubscribers();
              })
              .catch(error => console.log(error));

            // Reset firebase modified flag
            this.databaseRef.set(false);

            // Update dropbox cursor
            this.getDropboxCursor()
              .then(cursor => this.cursor = cursor)
              .catch(error => console.log(error));
          }
        });
      })
      .catch(error => console.log(error));
  }

  //----------------------------------------
  // Converts utc time format to local time
  //----------------------------------------
  getLocalTime(utcTime) {
    // Empty string for folders
    if (!utcTime)
      return null;

    const date = new Date(utcTime);
    const options = {
      hour: "2-digit",
      minute: "2-digit"
    }

    return date.toLocaleDateString(navigator.language, options);
  }

  //----------------------------------------
  // Call this to subscribe to state
  //----------------------------------------
  getState(): Observable<FileState> {
    return this.subject.asObservable();
  }

  //----------------------------------------
  // Fetch file data depending on file extension, for later preview
  //----------------------------------------
  fetchFileData(path = "") {
    let extension = this.getFileExtension(path);

    // Define possible preview file extensions
    let pdfPreviewExtension = ["ai", "doc", "docm", "docx", "eps", "odp", "odt", "pps", "ppsm", "ppsx", "ppt", "pptm", "pptx", "rtf"];
    let htmlPreviewExtension = ["csv", "ods", "xls", "xlsm", "xlsx"];
    let imageExtension = ["gif", "png", "jpg", "jpeg", "bmp", "tiff", "tif"];
    let textExtension = ["txt", "html", "java", "js", "css", "log", "tex"];

    // Do nothing with files without extensions
    if (extension === "") {
      this.fileState.preview = {
        data: "No Preview Could Be Generated",
        type: "unsupported"
      };
      this.updateSubscribers();
    }
    // Download PDF file
    else if (extension === "pdf") {

      this.dbx.filesGetTemporaryLink({ path })
        .then(response => response.link)
        .then(link => {

          // Get the data from the download link
          let xhr = new XMLHttpRequest();
          xhr.addEventListener("load", (event) => {
            let response = event.currentTarget["response"];
            let file = new Blob([response], { type: 'application/pdf' });
            let fileURL = URL.createObjectURL(file);
            this.fileState.preview = {
              data: this.sanitizer.bypassSecurityTrustResourceUrl(fileURL),
              type: "application/pdf"
            };
            this.updateSubscribers();
          });
          xhr.responseType = "arraybuffer";
          xhr.open("GET", link);
          xhr.send();
        })
        .catch(error => console.log(error));
    }
    // Download PDF and HTML previews of files
    else if (pdfPreviewExtension.includes(extension) || htmlPreviewExtension.includes(extension)) {

      this.dbx.filesGetPreview({ path })
        .then(response => response.fileBlob)
        .then(fileBlob => {

          let fileURL = URL.createObjectURL(fileBlob);
          this.fileState.preview = {
            data: this.sanitizer.bypassSecurityTrustResourceUrl(fileURL),
            type: fileBlob.type
          };
          this.updateSubscribers();
        })
        .catch(error => console.log(error));
    }
    // Get link of image
    else if (imageExtension.includes(extension)) {

      this.dbx.filesGetTemporaryLink({ path })
        .then(response => response.link)
        .then(link => {

          this.fileState.preview = {
            data: link,
            type: "image"
          };
          this.updateSubscribers();
        })
        .catch(error => console.log(error));
    }
    // Get link of text files
    else if (textExtension.includes(extension)) {

      this.dbx.filesGetTemporaryLink({ path })
        .then(response => response.link)
        .then(link => {

          // Get the data from the download link
          let xhr = new XMLHttpRequest();
          xhr.addEventListener("load", (event) => {
            let responseText = event.currentTarget["responseText"];
            this.fileState.preview = {
              data: responseText,
              type: "text"
            };
            this.updateSubscribers();
          });
          xhr.open("GET", link);
          xhr.send();
        })
        .catch(error => console.log(error));
    }
    // Default is unsupported preview
    else {
      this.fileState.preview = {
        data: "No Preview Could Be Generated",
        type: "unsupported"
      };
      this.updateSubscribers();
    }
  }

  //----------------------------------------
  // Fetch file structure with meta info from path
  //----------------------------------------
  fetchFiles(path = "", fileType: FileType = FileType.folder) {

    this.fileState.error = null; // emptying fileState.error

    // Only fetch if there is not another fetch already pending
    if (!this.fileState.loading) {
      // Extract folder path, if file path
      if (fileType === FileType.file) {
        path = this.getFolderPath(path);
      }

      // If the path has already been visited, fetch from cache
      if (this.fileState.paths[path]) {
        this.fileState.currentPath = path;
        this.updateSubscribers();
      }
      // Else, fetch from dropbox
      else {
        this.fileState.loading = true;
        this.dbx.filesListFolder({ path })
          .then(response => response.entries)
          .then(files => {

            // Store file meta data in state (which also is cache)
            this.fileState.currentPath = path;
            this.fileState.paths[path] = files.map(file => this.constructFile(file));

            this.fileState.loading = false;
            this.updateStarredFiles(this.fileState.paths[path], path);
            this.updateSubscribers();
          })
          .catch(err => {
            this.fileState.error = err;
            this.fileState.loading = false;
            this.updateSubscribers();
          });
      }
    }

  }

  //----------------------------------------
  // Get latest cursor, knows about the latest state in the whole dropbox
  //----------------------------------------
  getDropboxCursor() {
    return this.dbx.filesListFolderGetLatestCursor({
      path: "",
      recursive: true,
      include_media_info: false,
      include_deleted: true,
      include_has_explicit_shared_members: false,
      include_mounted_folders: true
    })
      .then(response => response.cursor)
  }

  //----------------------------------------
  // modifies the file size in to units.
  //----------------------------------------
  getImprovedSize(bytes, precision = 1) {
    if (bytes === 0) { return '0 bytes' }
    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '';
    if (typeof precision === 'undefined') precision = 1;

    var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
      number = Math.floor(Math.log(bytes) / Math.log(1024)),
      val = (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision);

    return (val.match(/\.0*$/) ? val.substr(0, val.indexOf('.')) : val) + ' ' + units[number];
  }

  //----------------------------------------
  // Get icon path based on filetype and file extension
  //----------------------------------------
  getIconPath(fileName: string, fileType: string) {
    let iconPath = "assets/file-icons/32px/";

    // Check if folder
    if (FileType[fileType] === FileType["folder"]) {
      iconPath += "folder";
    }
    else {
      let extension = this.getFileExtension(fileName);
      // No file extension
      if (extension === "") {
        iconPath += "_blank";
      }
      else {
        let availableExtensions = ["aac", "ai", "aiff", "avi", "bmp", "c", "cpp", "css", "csv", "dat", "dmg", "doc", "dotx", "dwg", "dxf", "eps", "exe", "flv", "gif", "h", "hpp", "html", "ics", "iso", "java", "jpg", "js", "key", "less", "mid", "mp3", "mp4", "mpg", "odf", "ods", "odt", "otp", "ots", "ott", "pdf", "php", "png", "ppt", "psd", "py", "qt", "rar", "rb", "rtf", "sass", "scss", "sql", "tga", "tgz", "tiff", "txt", "wav", "xls", "xlsx", "xml", "yml", "zip"];
        if (availableExtensions.includes(extension)) {
          iconPath += extension;
        }
        else {
          iconPath += "_blank";
        }
      }
    }

    iconPath += ".png";
    return iconPath;
  }

  //----------------------------------------
  // Get lower case file extension of file from path. 
  // If no extension exists, an empty string is returned.
  //----------------------------------------
  getFileExtension(filePath) {
    let fileName = this.getFileName(filePath);
    let pos = fileName.lastIndexOf(".");
    let extension = pos < 1 ? "" : fileName.slice(pos + 1);

    return extension.toLowerCase();
  }

  //----------------------------------------
  // Get file name from path
  //----------------------------------------
  getFileName(filePath) {
    let pos = filePath.lastIndexOf("/");
    let fileName = filePath.slice(pos + 1);

    return fileName;
  }

  //----------------------------------------
  // Get folder path from file path. That is, remove file from path string.
  //----------------------------------------
  getFolderPath(filePath) {
    let pos = filePath.lastIndexOf("/");
    let folderPath = filePath.substring(0, pos);

    return folderPath;
  }

  //----------------------------------------
  // Uploads file to dropbox
  //----------------------------------------
  uploadFile(file: File) {

    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;
      const dataArray = new Int8Array(data);

      // Start upload to Dropbox
      this.dbx.filesUpload({
        contents: dataArray,
        path: this.fileState.currentPath + "/" + file.name,
        mode: {
          '.tag': 'add'
        },
        autorename: true,
        mute: false
      })
        .then(file => {

          // Build uploaded file
          file[".tag"] = "file";
          const newFile = this.constructFile(file);

          // Extract folder path
          const folderPath = newFile.path.substring(0, newFile.path.indexOf(newFile.name) - 1);

          // Check if file already exists
          let alreadyExists = false;
          for (let f of this.fileState.paths[folderPath]) {
            if (f.id === newFile.id) {
              alreadyExists = true;
            }
          }

          // Update UI if file not already exists
          if (!alreadyExists) {
            this.fileState.paths[folderPath].push(newFile);
            this.updateSubscribers();
          }
          else {
            // TODO: notify subscribers of error
          }

        })
        .catch(error => {
          console.log(error);
          this.updateSubscribers();
        });
    };
    reader.readAsArrayBuffer(file);
  }

  //----------------------------------------
  // Deletes file from dropbox
  //----------------------------------------
  deleteFile(delFile: IFile){
    let path = delFile.path;
    let folderPath = this.getFolderPath(path);

    // Remove entry locally
    this.fileState.paths[folderPath] = this.fileState.paths[folderPath]
      .filter(file => file.name !== delFile.name);
    this.updateSubscribers();

    // Remove on Dropbox
    this.dbx.filesDeleteV2({ path })
      .then(file => console.log(file))
      .catch(error => {
        // If there was an error, undo deletion.
        this.fileState.paths[folderPath].push(delFile);
        this.updateSubscribers();
        // TODO: notify subscribers of error
      });
  }

  //----------------------------------------
  // Construct IFile from Dropbox file
  //----------------------------------------
  constructFile(file): IFile {
    let fileType: string = file[".tag"]; // File or Folder

    return ({
      id: file.id,
      fileType: FileType[fileType],
      name: file.name,
      path: file.path_display,
      modified: this.getLocalTime(file.client_modified),
      size: this.getImprovedSize(file.size),
      starred: this.starredFiles.find(f => f.id === file.id) ? true : false,
      iconPath: this.getIconPath(file.name, fileType)
    });
  }

  //----------------------------------------
  // Downloads file from Dropbox
  //----------------------------------------
  downloadFile(file: IFile) {
    let path = file.path;

    this.dbx.filesGetTemporaryLink({ path })
      .then(response => response.link)
      .then(link => {
        // Creates a temporary download link, so that download starts immediately
        const a = document.createElement('a');
        a.setAttribute('href', link);
        a.setAttribute('download', this.getFileName(path));
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      })
  }

  //----------------------------------------
  // Get file ID from parent HTML element in event
  //----------------------------------------
  getFileIdByParentFromEvent(event){
    let fileId;

    // Chrome, Opera
    if(event.path){ 
      fileId = event.path.find(tag => tag.id.startsWith("id:")).id;
    }

    // Edge
    else if(event.srcElement){
      let tag = event.srcElement.parentNode;
      while(!tag.id.startsWith("id:")){
        tag = tag.parentNode;
      }
      fileId = tag.id;
    }

    // Firefox
    else if(event.target){
      let tag = event.target.parentNode;
      while(!tag.id.startsWith("id:")){
        tag = tag.parentNode;
      }
      fileId = tag.id;
    }

    return fileId;
  }

  //----------------------------------------
  // Set selected file
  //----------------------------------------
  setSelectedFile(fileId) {
    this.fileState.selectedFile = fileId;
    this.updateSubscribers();
  }

  //----------------------------------------
  // Toggle starring of a file
  //----------------------------------------
  toggleStar(currentFile: IFile) {
    currentFile.starred = !currentFile.starred;

    // If it was starred, push to array
    if (currentFile.starred) {
      this.starredFiles.push(currentFile);
    }
    // Else remove it from array
    else {
      let index = this.starredFiles.findIndex(file => file.id === currentFile.id);
      this.starredFiles.splice(index, 1); // tar bort starredFiles första state som är en tom lista
    }

    // Update local storage
    localStorage.setItem("starredFiles" + this.authService.USER_ID, JSON.stringify(this.starredFiles));
  }

  //----------------------------------------
  // Updates or removes starred file
  //----------------------------------------
  updateStarredFile(file, isDeleted = false) {

    // Special case for deleted files (don't know if starred or not)
    if (isDeleted) {
      const filePath = file["path_display"];
      const pos = this.starredFiles.findIndex(starredFile => {
        return starredFile.path === filePath;
      });
      if (pos !== -1) {
        this.starredFiles.splice(pos, 1);
      }
    }
    // Modified starred file 
    else {
      const pos = this.starredFiles.findIndex(starredFile => {
        return file.id === starredFile.id;
      });
      if (pos !== -1) {
        this.starredFiles[pos] = file;
      }
    }

    // Update local storage
    localStorage.setItem("starredFiles" + this.authService.USER_ID, JSON.stringify(this.starredFiles));
  }

  //----------------------------------------
  // Updates or removes starred files, after syncing to incoming files in path
  //----------------------------------------
  updateStarredFiles(incomingFiles, path) {

    // Prapare check with starred files in this path
    const isStarredInPath = this.starredFiles.map((file, index) => {
      return this.getFolderPath(file.path) === path;
    });

    // Update starred files list
    for (let file of incomingFiles) {
      // Update starred file with incoming info
      if (file.starred) {
        for (let i in this.starredFiles) {
          if (isStarredInPath[i]) {
            // Match! 
            if (file.id === this.starredFiles[i].id) {
              // Now update!
              this.starredFiles[i] = file;

              // Mark starred file as updated
              isStarredInPath[i] = false;
            }
          }
        }
      }
    }

    // Delete any starred files that didn't exist
    for (let i = this.starredFiles.length - 1; i >= 0; i--) {
      if (isStarredInPath[i]) {
        this.starredFiles.splice(i, 1);
      }
    }

    // Update local storage
    localStorage.setItem("starredFiles" + this.authService.USER_ID, JSON.stringify(this.starredFiles));
  }

  //----------------------------------------
  // Updates all subscribers of state.
  //----------------------------------------
  updateSubscribers() {
    console.log(this.fileState);
    this.subject.next(this.fileState);
  }

  //----------------------------------------
  // Logs out user
  //----------------------------------------
  logout(){
    this.dbx.authTokenRevoke();
    this.authService.logout();
  }

}
