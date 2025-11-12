const fs = require('fs');
const path = require('path');

const clientPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
const defaultJsPath = path.join(clientPath, 'default.js');

if (fs.existsSync(clientPath) && !fs.existsSync(defaultJsPath)) {
  // Create default.js that exports PrismaClient
  const defaultJsContent = `// Auto-generated file to fix Prisma client import
// This file is needed because @prisma/client expects .prisma/client/default
const runtime = require('@prisma/client/runtime/library');

// Import the class module (TypeScript, but Next.js will handle it)
let $Class;
try {
  // Try to require the TypeScript file (Next.js/Turbopack handles this)
  $Class = require('./internal/class');
} catch (e) {
  // Fallback: create a minimal PrismaClient
  const { getPrismaClient } = runtime;
  const PrismaClient = getPrismaClient({ dirname: __dirname });
  module.exports = { PrismaClient };
  return;
}

// Get PrismaClient class
const PrismaClient = $Class.getPrismaClientClass(__dirname);
module.exports = { PrismaClient };
`;

  fs.writeFileSync(defaultJsPath, defaultJsContent);
  console.log('✅ Created default.js for Prisma client');
} else if (fs.existsSync(defaultJsPath)) {
  console.log('ℹ️  default.js already exists');
} else {
  console.log('⚠️  Prisma client directory not found. Run "prisma generate" first.');
}

