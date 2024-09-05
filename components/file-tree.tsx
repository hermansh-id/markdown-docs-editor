'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

type FileNode = {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

type FileTreeProps = {
  data: FileNode[]
  onSelectFile: (path: string) => void
}

const FileTreeNode: React.FC<{ node: FileNode; path: string; onSelectFile: (path: string) => void }> = ({ node, path, onSelectFile }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOpen = () => {
    if (node.type === 'folder') {
      setIsOpen(!isOpen)
    }
  }

  const handleSelectFile = () => {
    if (node.type === 'file') {
      onSelectFile(path)
    }
  }

  return (
    <div>
      <Button
        variant="ghost"
        className={`w-full justify-start ${
          node.type === 'file' ? 'pl-6' : ''
        }`}
        onClick={node.type === 'folder' ? toggleOpen : handleSelectFile}
      >
        {node.type === 'folder' && (
          isOpen ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />
        )}
        {node.type === 'folder' ? (
          <Folder className="mr-2 h-4 w-4 text-blue-500" />
        ) : (
          <FileText className="mr-2 h-4 w-4 text-gray-500" />
        )}
        <span>{node.name}</span>
      </Button>
      {node.type === 'folder' && isOpen && (
        <div className="pl-4">
          {node.children?.map((childNode, index) => (
            <FileTreeNode
              key={index}
              node={childNode}
              path={`${path}/${childNode.name}`}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const FileTree: React.FC<FileTreeProps> = ({ data, onSelectFile }) => {
  return (
    <div className="space-y-1">
      {data.map((node, index) => (
        <FileTreeNode key={index} node={node} path={node.name} onSelectFile={onSelectFile} />
      ))}
    </div>
  )
}