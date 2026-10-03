import { rmSync } from 'node:fs';

// Cross-platform dist clean (rm -rf does not exist on Windows).
rmSync('dist', { recursive: true, force: true });
