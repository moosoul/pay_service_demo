#!/bin/sh

# 等待数据库就绪
echo "Waiting for database to be ready..."
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm start:prod