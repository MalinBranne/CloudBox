import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { IFile, FileType, FileState } from './constants';

const Dropbox = require('dropbox').Dropbox;
import 'rxjs/add/operator/map';
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
    loading: false
  };
  subject = new BehaviorSubject(this.fileState);

  starredFiles = [];
  cursor;

  dbx = new Dropbox({ clientId: this.authService.CLIENT_ID, accessToken: this.authService.ACCESS_TOKEN });
  databaseRef;

  //----------------------------------------
  // Constructor
  //----------------------------------------
  constructor(private authService: AuthService, private sanitizer: DomSanitizer) { 

    // Create or sync starred files in local storage for current user
    if(!localStorage.getItem("starredFiles" + this.authService.USER_ID)){
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
          if(wasModified){

            // Get modified files
            this.dbx.filesListFolderContinue({cursor: this.cursor})
              .then(response => {
                // Save relevant info
                const changedFiles = response.entries;

                // Update files in state
                for(let changedFile of changedFiles){

                  console.log(changedFile);
                  const filePath = changedFile["path_display"];
                  const folderPath = this.getFolderPath(filePath);
                  
                  // Check if cached parent folder exists, otherwise do nothing
                  if(this.fileState.paths[folderPath]){

                    // Deleted file or folder
                    if(changedFile[".tag"] === "deleted"){ 
  
                      // Remove entry
                      this.fileState.paths[folderPath] = this.fileState.paths[folderPath]
                        .filter(file => file.name !== changedFile.name);
  
                      // Remove path, if exists (for folder)
                      delete this.fileState.paths[filePath];
  
                      // Redirect to root folder if in deleted folder 
                      if(this.fileState.currentPath === filePath){
                        this.fileState.currentPath = "";
                      }
                    }
                    // New or modified file or folder
                    else{ 

                      // Delete possible pre-existing entry
                      this.fileState.paths[folderPath] = this.fileState.paths[folderPath]
                        .filter(file => file.id !== changedFile.id);

                      // Push the new entry
                      let fileType: string = changedFile[".tag"]; // File or Folder
                      this.fileState.paths[folderPath].push({
                        id: changedFile.id,
                        fileType: FileType[fileType],
                        name: changedFile.name,
                        path: filePath,
                        modified: changedFile.client_modified,
                        size: changedFile.size,
                        starred: this.starredFiles.find(f => f.id === changedFile.id) ? true : false,
                        iconPath: this.getIconPath(changedFile.name, fileType)
                      });
                    }
                  } 
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
  // Call this to subscribe to state
  //----------------------------------------
  getState(): Observable<FileState>{
      return this.subject.asObservable();
  }

  //----------------------------------------
  // Fetch file data depending on file extension, for later preview
  //----------------------------------------
  fetchFileData(path = ""){
    let extension = this.getFileExtension(path);
    
    // Define possible preview file extensions
    let pdfPreviewExtension = ["ai", "doc", "docm", "docx", "eps", "odp", "odt", "pps", "ppsm", "ppsx", "ppt", "pptm", "pptx", "rtf"];
    let htmlPreviewExtension = ["csv", "ods", "xls", "xlsm", "xlsx"];
    let imageExtension = ["gif", "png", "jpg", "jpeg", "bmp", "tiff", "tif"];
    let textExtension = ["txt", "html", "java", "js", "css", "log", "tex"];

    // Do nothing with files without extensions
    if(extension === ""){
      this.fileState.preview = {
        data: "No Preview Could Be Generated",
        type: "unsupported"
      };
      this.updateSubscribers();
    }
    // Download PDF file
    else if(extension === "pdf"){
      
      this.dbx.filesGetTemporaryLink({path})
        .then(response => response.link)
        .then(link => {

          // Get the data from the download link
          let xhr = new XMLHttpRequest();
          xhr.addEventListener("load", (event) => {
            let response = event.currentTarget["response"];
            let file = new Blob([response], {type: 'application/pdf'});
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
    else if(pdfPreviewExtension.includes(extension) || htmlPreviewExtension.includes(extension)){

      this.dbx.filesGetPreview({path})
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
    else if(imageExtension.includes(extension)){

      this.dbx.filesGetTemporaryLink({path})
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
    else if(textExtension.includes(extension)){

      this.dbx.filesGetTemporaryLink({path})
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
    else{
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
  fetchFiles(path = "", fileType: FileType = FileType.folder){
    // Only fetch if there is not another fetch already pending
    if(!this.fileState.loading){
      // Extract folder path, if file path
      if(fileType === FileType.file){
        path = this.getFolderPath(path);
      }

      // If the path has already been visited, fetch from cache
      if(this.fileState.paths[path]){
        this.fileState.currentPath = path;
        this.updateSubscribers();
      }
      // Else, fetch from dropbox
      else{
        // Set the login anchors href using dbx.getAuthenticationUrl()
        this.fileState.loading = true;
        this.dbx.filesListFolder({ path })
          .then(response => response.entries)
          .then(files => {

            // Store file meta data in state (which also is cache)
            this.fileState.currentPath = path;
            this.fileState.paths[path] = files.map(file => {
              let fileType: string = file[".tag"]; // File or Folder
              return ({
                id: file.id,
                fileType: FileType[fileType],
                name: file.name,
                path: file.path_display,
                modified: file.client_modified,
                size: file.size,
                starred: this.starredFiles.find(f => f.id === file.id) ? true : false,
                iconPath: this.getIconPath(file.name, fileType)
              });
            });

            this.updateSubscribers();
          })
          .catch(err => {
            console.log("There was an error getting the files ");
            console.log(err);
            this.updateSubscribers();
          });
      }
    }
  }

  //----------------------------------------
  // Get latest cursor, knows about the latest state in the whole dropbox
  //----------------------------------------
  getDropboxCursor(){
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
  // Get icon path based on filetype and file extension
  //----------------------------------------
  getIconPath(fileName: string, fileType: string){
    let iconPath = "assets/file-icons/32px/";

    // Check if folder
    if(FileType[fileType] === FileType["folder"]){
      iconPath += "folder";
    }
    else{
      let extension = this.getFileExtension(fileName);
      // No file extension
      if(extension === ""){
        iconPath += "_blank";
      }
      else {
        let availableExtensions = ["aac", "ai", "aiff", "avi", "bmp", "c", "cpp", "css", "csv", "dat", "dmg", "doc", "dotx", "dwg", "dxf", "eps", "exe", "flv", "gif", "h", "hpp", "html", "ics", "iso", "java", "jpg", "js", "key", "less", "mid", "mp3", "mp4", "mpg", "odf", "ods", "odt", "otp", "ots", "ott", "pdf", "php", "png", "ppt", "psd", "py", "qt", "rar", "rb", "rtf", "sass", "scss", "sql", "tga", "tgz", "tiff", "txt", "wav", "xls", "xlsx", "xml", "yml", "zip"];
        if(availableExtensions.includes(extension)){
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
  getFileExtension(filePath){
    let fileName = this.getFileName(filePath);    
    let pos = fileName.lastIndexOf(".");
    let extension = pos < 1 ? "" : fileName.slice(pos + 1);

    return extension.toLowerCase();
  }

  //----------------------------------------
  // Get file name from path
  //----------------------------------------
  getFileName(filePath){
    let pos = filePath.lastIndexOf("/");
    let fileName = filePath.slice(pos + 1);

    return fileName;
  }

  //----------------------------------------
  // Get folder path from file path. That is, remove file from path string.
  //----------------------------------------
  getFolderPath(filePath){
    let pos = filePath.lastIndexOf("/");
    let folderPath = filePath.substring(0, pos);

    return folderPath;
  }

  //----------------------------------------
  // Uploads file to dropbox
  //----------------------------------------
  uploadFile(file: File){

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
          const newFile = {
            id: file.id,
            fileType: FileType["file"],
            name: file.name,
            path: file.path_display,
            modified: file.client_modified,
            size: file.size,
            starred: this.starredFiles.find(f => f.id === file.id) ? true : false,
            iconPath: this.getIconPath(file.name, "file")
          };

          // Extract folder path
          const folderPath = newFile.path.substring(0, newFile.path.indexOf(newFile.name) - 1);
          
          // Check if file already exists
          let alreadyExists = false;
          for(let f of this.fileState.paths[folderPath]){
            if(f.id === newFile.id){
              alreadyExists = true;
            }
          }

          // Update UI if file not already exists
          if(!alreadyExists){
            this.fileState.paths[folderPath].push(newFile);
            this.updateSubscribers();
          }
          // Else, notify subscribers 
          else{
            // TODO
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
  // Downloads file from Dropbox, based on ID
  //----------------------------------------
  downloadFileFromId(id: string){
    let currentFile = this.getFileFromId(id);
    this.downloadFile(currentFile["path"]);
  }
  
  //----------------------------------------
  // Downloads file from Dropbox, based on path
  //----------------------------------------
  downloadFile(path: string){
    this.dbx.filesGetTemporaryLink({path})
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
  // Get file from ID. Must be a file that is in cache.
  //----------------------------------------
  getFileFromId(id){
    let currentFile = this.fileState.paths[this.fileState.currentPath]
      .find(file => file.id === id);
    return currentFile;
  }

  //----------------------------------------
  // Toggle starring of a file. Must be in cache.
  //----------------------------------------
  toggleStar(fileId){
    let currentFile = this.getFileFromId(fileId);
    currentFile.starred = !currentFile.starred;

    // If it was starred, push to array
    if (currentFile.starred){
      this.starredFiles.push(currentFile);
    } 
    // Else remove it from array
    else {
      let index = this.starredFiles.findIndex(file => file.id === fileId);
      this.starredFiles.splice(index, 1); // tar bort starredFiles första state som är en tom lista
    }

    // Update local storage
    localStorage.setItem("starredFiles" + this.authService.USER_ID, JSON.stringify(this.starredFiles));
  }

  //----------------------------------------
  // Updates all subscribers of state.
  //----------------------------------------
  updateSubscribers(){
    this.fileState.loading = false;
    console.log(this.fileState);
    this.subject.next(this.fileState);
  }

}
