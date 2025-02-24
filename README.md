# 项目运行文档

## 环境要求

- Node.js >= 20
- Docker & Docker Compose
- PostgreSQL
- Stripe 账号和API密钥

## 环境变量配置

在项目根目录创建 `.env` 文件，配置以下环境变量：

```bash
NODE_ENV=development # development, production
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/pay_service?schema=public"
PORT=3000 # 端口, 默认3000
REDIS_URL="redis://redis:6379" # 缓存连接


STRIPE_PUBLISHABLE_KEY="pk_test_51QvFOaPEmqbOLh0diAbNWgpffapp5tOte73b4lcaDa1rCLvBYQceRlIqUyb0qoMw7dwG7Q4j2MpJDt8p91jFDhvD003FTZe2dX"
STRIPE_SECRET_KEY="sk_test_51QvFOaPEmqbOLh0daEojJzep8mIMQVBmvhS21t8i8XyyeesdtsqYxS9cpl2hBDueRK3ywIAylLG2AWjwUC68IR4i00nqt7QwKs" # Stripe 密钥
STRIPE_WEBHOOK_SECRET="whsec_R0IB6ciQHg2AcShI7eYeKwecXiYTGB94" # Stripe 签名密钥
STRIPE_API_VERSION="2025-01-27.acacia;custom_checkout_beta=v1" # Stripe 版本, 默认2025-01-27.acacia, 如需要启用ui_mode=custom需要指定为2025-01-27.acacia;custom_checkout_beta=v1
```

## Docker运行

```bash
# 创建.env.docker文件, 并配置环境变量
# 构建并启动所有服务
docker-compose up -d # 会启动一个postgres数据库和redis, 如果和系统有冲突, 请自行修改docker-compose.yml以及.env文件对应的postgres和redis的配置
```

## 直接运行

### 安装依赖

```bash
# 安装项目依赖
npm install -g pnpm
pnpm install
```

### 数据库初始化

```bash
# 创建.env文件, 并配置环境变量

# 运行数据库迁移
npx prisma migrate deploy
# 初始化基础数据
npx prisma db seed
```

基础数据包含：

- 测试用户
- 充值产品
- 支持的货币

### 开发环境运行

```bash
# 启动开发服务器
npm run start:dev
```

## API文档

启动服务后，访问以下地址查看Swagger API文档：

```
http://localhost:3000/openapi
```

## 测试

```bash
# 运行测试
npm run test
```

## 充值流程测试

**测试数据所在位置prisma/seed.json**

1. 使用测试用户ID进行认证：

   - User1: `73687270-1b0b-400e-b0d3-6f6816c0e707`
   - User2: `4bf83df0-21a4-41ff-a9f5-0bd3cee04b46`

2. 可用的充值产品：

   - Topup1000: `8e464e7e-90e5-494f-a3f0-410c341df0d6`
   - Topup3000: `ebc49129-9075-4020-ac37-a87cda66918c`
   - Topup9000: `43a77bfd-407a-4a64-94e7-0d9be3d41eda`

3. 支持的货币：
   - USD (默认)
   - HKD
   - CNY

## 充值CURL测试例子

```bash
# 使用User1进行充值
curl -X POST localhost:3000/api/topup -H "Content-Type: application/json" -H "Authorization: 73687270-1b0b-400e-b0d3-6f6816c0e707" -d '{"uiMode": "hosted", "callbackUrl": "http://localhost:3000", "cancelUrl": "http://localhost:3000", "products": [{"id": "8e464e7e-90e5-494f-a3f0-410c341df0d6", "quantity": 2}], "currencyCode": "CNY"}'

# 使用User2进行退款
curl -X POST localhost:3001/api/topup/566d5fc8-fc78-48cd-9d7b-ed68a31f9820/refund -H "Content-Type: application/json" -H "Authorization: 73687270-1b0b-400e-b0d3-6f6816c0e707" -d '{"amount": "100"}'
```

## 注意事项

1. 确保Stripe Webhook配置正确，用于接收支付状态回调
2. 开发环境建议使用Stripe测试密钥
3. 数据库迁移前请备份数据
4. 测试时注意清理测试数据

## 常见问题

1. 数据库连接失败

   - 检查数据库服务是否运行
   - 验证数据库连接字符串是否正确

2. Stripe支付失败

   - 确认API密钥是否正确
   - 检查产品价格是否符合Stripe要求

3. 测试失败
   - 确保测试数据库配置正确
   - 检查测试环境变量是否正确设置
