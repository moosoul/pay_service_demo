import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TopupModule } from './topup.module';
import { CreateTopupDto, StripeCheckoutUiMode } from './dtos/create-topup.dto';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { AppModule } from '@/app.module';
import { HttpExceptionFilter } from '@/filters/http-exception.filter';
import { HttpResponseInterceptor } from '@/interceptors/http-response.interceptor';

describe('TopupController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testUserId = '73687270-1b0b-400e-b0d3-6f6816c0e707';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // 配置与 main.ts 相同的全局管道、拦截器和过滤器
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    app.useGlobalInterceptors(new HttpResponseInterceptor());

    app.useGlobalFilters(new HttpExceptionFilter());

    prisma = await moduleFixture.resolve<PrismaService>(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    // 清理测试数据
    await prisma.productOnTransaction.deleteMany();
    await prisma.stripePaymentData.deleteMany();
    await prisma.transaction.deleteMany();
  });

  describe('/topup (POST)', () => {
    it('should create a new topup transaction', async () => {
      const createTopupDto: CreateTopupDto = {
        uiMode: StripeCheckoutUiMode.hosted,
        callbackUrl: 'http://example.com/callback',
        products: [
          {
            id: '8e464e7e-90e5-494f-a3f0-410c341df0d6', // 使用seed.json中的产品ID
            quantity: 1,
          },
        ],
        currencyCode: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post('/topup')
        .set('Authorization', testUserId)
        .send(createTopupDto)
        .expect(201);

      expect(response.body.data).toHaveProperty('transactionId');
      expect(response.body.data).toHaveProperty('tranactionNo');
      expect(response.body.data).toHaveProperty('clientSecret');
      expect(response.body.data).toHaveProperty('redirectUrl');
      expect(response.body.data.uiMode).toBe(StripeCheckoutUiMode.hosted);

      const { transactionId } = response.body.data;

      // 测试获取交易详情
      const detailResponse = await request(app.getHttpServer())
        .get(`/topup/${transactionId}`)
        .set('Authorization', testUserId)
        .expect(200);

      expect(detailResponse.body.data).toBeDefined();
      expect(detailResponse.body.data).toMatchObject({
        id: transactionId,
        status: expect.any(String),
        amount: expect.any(Number),
        currency: 'USD',
      });

      // 测试获取交易状态
      const statusResponse = await request(app.getHttpServer())
        .get(`/topup/${transactionId}/status`)
        .set('Authorization', testUserId)
        .expect(200);

      expect(statusResponse.body.data).toBeDefined();
      expect(statusResponse.body.data).toMatchObject({
        id: transactionId,
        status: expect.any(String),
      });
    });

    it('should handle invalid product id', async () => {
      const createTopupDto: CreateTopupDto = {
        uiMode: StripeCheckoutUiMode.hosted,
        callbackUrl: 'http://example.com/callback',
        products: [
          {
            id: 'invalid-product-id',
            quantity: 1,
          },
        ],
        currencyCode: 'USD',
      };

      await request(app.getHttpServer())
        .post('/topup')
        .set('Authorization', testUserId)
        .send(createTopupDto)
        .expect(400);
    });
  });

  describe('/topup/:id (GET)', () => {
    it('should return 404 for non-existent transaction', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/topup/${nonExistentId}`)
        .set('Authorization', testUserId)
        .expect(404);
    });
  });

  afterEach(async () => {
    // 清理测试数据
    await prisma.productOnTransaction.deleteMany();
    await prisma.stripePaymentData.deleteMany();
    await prisma.transaction.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });
});
