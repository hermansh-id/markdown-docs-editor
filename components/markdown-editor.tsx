"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Play } from "lucide-react";
import { FileTree } from "./file-tree";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import styles from "./MarkdownStyles.module.css";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { RocketIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

type FileNode = {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
};

export function AppComponentsMarkdownEditor() {
  const [markdown, setMarkdown] = useState("# Hello, Markdown!");
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [alert, setAlert] = useState<{ show: boolean; title: string; description: string; variant: 'default' | 'destructive' }>({
    show: false,
    title: "",
    description: "",
    variant: 'default'
  });

  useEffect(() => {
    fetchFileTree();
  }, []);

  const fetchFileTree = async () => {
    const response = await fetch("/api/files");
    const data = await response.json();
    console.log(data);
    setFileTree(data.fileTree);
  };

  const fetchFileContent = async (filename: string) => {
    const response = await fetch(`/api/files?filename=${filename}`);
    const data = await response.json();
    setMarkdown(data.content);
    setSelectedFile(filename);
  };

  const handleSave = async () => {
    console.log("Saving file:", selectedFile, "with content:", markdown);
    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: selectedFile, content: markdown }),
      });
      if (response.ok) {
        setAlert({
          show: true,
          title: "File Saved",
          description: `Successfully saved ${selectedFile}`,
          variant: 'default'
        });
      } else {
        throw new Error("Failed to save file");
      }
    } catch (error) {
      setAlert({
        show: true,
        title: "Error",
        description: `Failed to save ${selectedFile}`,
        variant: 'destructive'
      });
    }
    setTimeout(() => setAlert({ show: false, title: "", description: "", variant: 'default' }), 3000);
  };

  const handleRun = async () => {
    console.log("Running Markdown content");
    try {
      const response = await fetch('/api/run-build', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setAlert({
          show: true,
          title: "Build Successful",
          description: data.message,
          variant: 'default'
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setAlert({
        show: true,
        title: "Build Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: 'destructive'
      });
    }
    setTimeout(() => setAlert({ show: false, title: "", description: "", variant: 'default' }), 3000);
  };

  const handleFileSelect = (path: string) => {
    fetchFileContent(path);
  };
  const transformImageSrc = (src: string) => {
    if (src.startsWith('http') || src.startsWith('data:')) {
      return src;
    }
    const basePath = selectedFile.split('/').slice(0, -1).join('/');
    return `/api/files?filename=${encodeURIComponent(`${basePath}/${src}`)}`;
  };

  return (
    <div>
      {alert.show && (
        <div className="fixed top-4 right-4 z-50 w-72">
          <Alert variant={alert.variant}>
            {alert.variant === 'default' ? (
              <RocketIcon className="h-4 w-4" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4" />
            )}
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        </div>
      )}
      <div>
        <Menubar className="flex justify-between">
          <div>
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={handleSave}>Save</MenubarItem>
                <MenubarItem onClick={handleRun}>Run</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </div>
          <div className="px-4 py-2 text-sm text-muted-foreground">
            {selectedFile || "No file selected"}
          </div>
        </Menubar>
      </div>

      <div className="border-t">
        <div className="bg-background">
          <div className="grid lg:grid-cols-5">
            <div className="pb-12">
              <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Files</h2>
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <FileTree data={fileTree} onSelectFile={handleFileSelect} />
                  </ScrollArea>
                </div>
              </div>
            </div>
            <div className="col-span-3 lg:col-span-4 lg:border-l">
              <div className="h-full px-4 py-6 lg:px-8">
                <div className="h-full">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="bg-background border rounded-lg p-4 flex flex-col h-full">
                      <h3 className="text-lg font-semibold mb-2">Editor</h3>
                      <div className="flex-grow">
                        <MDEditor
                          value={markdown}
                          onChange={(value) => setMarkdown(value || "")}
                          preview="edit"
                          height="100%"
                        />
                      </div>
                    </div>
                    <div className="bg-background border rounded-lg p-4 flex flex-col h-full">
                      <h3 className="text-lg font-semibold mb-2">Preview</h3>
                      <ScrollArea className="flex-grow bg-white rounded">
                        <ReactMarkdown
                          className={styles.markdownContent}
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            img: ({ node, ...props }) => {
                              const transformedSrc = transformImageSrc(props.src || '');
                              return <img {...props} src={transformedSrc} />;
                            },
                            h1: ({ node, ...props }) => <h1 {...props} />,
                            h2: ({ node, ...props }) => <h2 {...props} />,
                            h3: ({ node, ...props }) => <h3 {...props} />,
                            h4: ({ node, ...props }) => <h4 {...props} />,
                            p: ({ node, ...props }) => <p {...props} />,
                            a: ({ node, ...props }) => <a {...props} />,
                            strong: ({ node, ...props }) => <strong {...props} />,
                            em: ({ node, ...props }) => <em {...props} />,
                            ul: ({ node, ...props }) => <ul {...props} />,
                            ol: ({ node, ...props }) => <ol {...props} />,
                            li: ({ node, ...props }) => <li {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote {...props} />,
                            table: ({ node, ...props }) => <table {...props} />,
                            th: ({ node, ...props }) => <th {...props} />,
                            td: ({ node, ...props }) => <td {...props} />,
                          }}
                        >
                          {markdown}
                        </ReactMarkdown>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
