import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    const { stdout, stderr } = await execAsync(`
      cd ~/nextgen/intellinum_docs/ &&
      bun run build &&
      sudo cp -r build/* /var/www/docs.intellinum.com/
    `);

    console.log('Build output:', stdout);
    if (stderr) console.error('Build errors:', stderr);

    return NextResponse.json({ message: 'Build completed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Build execution error:', error);
    return NextResponse.json({ error: 'Failed to run build' }, { status: 500 });
  }
}
