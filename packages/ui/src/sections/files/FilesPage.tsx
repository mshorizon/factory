"use client";

import * as React from "react";
import { Download, FileText, FileSpreadsheet, File } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { FilesPageProps, FileItem } from "./types";

const TYPE_ICON_MAP: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5" />,
  docx: <FileSpreadsheet className="h-5 w-5" />,
  doc: <FileSpreadsheet className="h-5 w-5" />,
  xlsx: <FileSpreadsheet className="h-5 w-5" />,
  xls: <FileSpreadsheet className="h-5 w-5" />,
};

function getFileIcon(type?: string) {
  if (!type) return <File className="h-5 w-5" />;
  return TYPE_ICON_MAP[type.toLowerCase()] ?? <File className="h-5 w-5" />;
}

function FileRow({ file }: { file: FileItem }) {
  const ext = file.type?.toUpperCase() || file.url.split(".").pop()?.toUpperCase() || "FILE";
  return (
    <a
      href={file.url}
      download
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between gap-spacing-md px-spacing-lg py-spacing-md border border-border rounded-radius bg-background hover:bg-muted/50 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center gap-spacing-md min-w-0">
        <span className="flex-shrink-0 text-primary">{getFileIcon(file.type)}</span>
        <span className="text-foreground font-medium text-sm truncate">{file.name}</span>
        <span className="flex-shrink-0 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded bg-muted text-muted-foreground">
          {ext}
        </span>
      </div>
      <Download className="flex-shrink-0 h-4 w-4 text-muted group-hover:text-primary transition-colors" />
    </a>
  );
}

export function FilesPage({ groups, className }: FilesPageProps) {
  return (
    <div className={cn("flex flex-col gap-spacing-3xl", className)}>
      <StaggerContainer className="flex flex-col gap-spacing-3xl" staggerDelay={0.1}>
        {groups.map((group, gi) => (
          <StaggerItem key={gi} direction="up" distance={16}>
            <div className="flex flex-col gap-spacing-lg">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-spacing-sm">
                {group.title}
              </h2>
              <div className="flex flex-col gap-spacing-sm">
                {group.files.map((file, fi) => (
                  <FileRow key={fi} file={file} />
                ))}
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
