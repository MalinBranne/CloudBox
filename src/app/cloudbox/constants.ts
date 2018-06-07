export enum FileType {
    file, folder
}

export interface IFile {
    id: number;
    fileType: FileType;
    name: string;
    path: string;
    modified?: string;
    size?: string;
    starred: boolean;
    iconPath: string;
}

export interface FileState {
    paths: {
        [path: string]: IFile[]
    }
    currentPath: string,
    error: {}
}

export interface SearchState {

    latestSearch: IFile[]

}