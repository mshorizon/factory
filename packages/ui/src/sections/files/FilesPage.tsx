"use client";

import * as React from "react";
import { ArrowDownToLine, FileText, FileSpreadsheet, File } from "lucide-react";
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
      className="group flex items-start justify-between gap-spacing-md px-spacing-lg py-spacing-md border border-border rounded-radius bg-background hover:border-primary/50 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex items-start gap-spacing-md min-w-0">
        <span className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-radius bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
          {getFileIcon(file.type)}
        </span>
        <div className="flex flex-row items-center flex-wrap gap-spacing-sm min-w-0 pt-1">
          <span className="text-foreground font-medium text-sm break-words">{file.name}</span>
          <span className="flex-shrink-0 inline-flex px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-primary text-primary-foreground">
            {ext}
          </span>
        </div>
      </div>
      <span className="flex-shrink-0 mt-1 flex items-center justify-center h-8 w-8 rounded-full border border-border bg-background group-hover:bg-primary group-hover:border-primary transition-all duration-200">
        <ArrowDownToLine className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-200" />
      </span>
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
              <div className="flex flex-col gap-spacing-sm">
                <span className="w-8 h-[2px] flex-shrink-0 bg-primary" />
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  {group.title}
                </h2>
              </div>
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
