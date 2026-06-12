/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "bcryptjs",
    "bullmq",
    "exceljs",
    "ioredis",
    "mammoth",
    "pdf-parse"
  ],
  poweredByHeader: false
};

export default nextConfig;
