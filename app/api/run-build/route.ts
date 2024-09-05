import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { stdout, stderr } = await execAsync(`
      cd ~/nextgen/intellinum_docs/ &&
      bun run build &&
      sudo cp -r build/* /var/www/docs.intellinum.com/
    `);

    console.log('Build output:', stdout);
    if (stderr) console.error('Build errors:', stderr);

    res.status(200).json({ message: 'Build completed successfully' });
  } catch (error) {
    console.error('Build execution error:', error);
    res.status(500).json({ error: 'Failed to run build' });
  }
}
