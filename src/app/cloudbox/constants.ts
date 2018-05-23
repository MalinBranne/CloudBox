export enum FileType {
    file, folder
}

export interface IFile {
    id: number;
    fileType: FileType;
    name: string;
    path: string;
    modified?: string;
    size?: number;
    starred: boolean;
}

export interface FileState {
    paths: {
        [path: string]: IFile[]
    }
    currentPath: string
}