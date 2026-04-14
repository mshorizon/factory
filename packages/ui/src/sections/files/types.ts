export interface FileItem {
  name: string;
  type?: string;
  url: string;
}

export interface FileGroup {
  title: string;
  files: FileItem[];
}

export interface FilesPageProps {
  groups: FileGroup[];
  className?: string;
}
