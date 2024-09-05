import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const TARGET_DIR = process.env.TARGET_DIR || './data'

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

async function buildFileTree(dir: string): Promise<FileNode[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const tree: FileNode[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const children = await buildFileTree(path.join(dir, entry.name));
      if (children.length > 0) {
        tree.push({ name: entry.name, type: 'folder', children });
      }
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
      tree.push({ name: entry.name, type: 'file' });
    }
  }

  return tree;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')

  try {
    if (filename) {
      const filePath = path.join(TARGET_DIR, filename)
      const ext = path.extname(filePath).toLowerCase()
      
      if (ext === '.md' || ext === '.mdx') {
        const content = await fs.readFile(filePath, 'utf-8')
        return NextResponse.json({ content })
      } else {
        const content = await fs.readFile(filePath)
        return new NextResponse(content, {
          headers: { 'Content-Type': 'image/*' }
        })
      }
    } else {
      const fileTree = await buildFileTree(TARGET_DIR)
      return NextResponse.json({ fileTree })
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'File not found or unable to read directory' }, { status: 404 })
  }
}

export async function POST(request: Request) {
  const { filename, content } = await request.json()
  
  try {
    const filePath = path.join(TARGET_DIR, filename)
    await fs.writeFile(filePath, content)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Unable to write file' }, { status: 500 })
  }
}