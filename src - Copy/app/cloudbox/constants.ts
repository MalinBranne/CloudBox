
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
    iconPath: string;
}

export interface FileState {
    paths: {
        [path: string]: IFile[]
    }
    currentPath: string
    preview: {
        data: any,
        type: string
    }
    loading: boolean
}