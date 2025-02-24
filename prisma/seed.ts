import { PrismaClient } from '@prisma/client';
import seedData from './seed.json';

const prisma = new PrismaClient();

const initCurrencies = async () => {
  const currencies = seedData.currencies.map((currency) => ({
    code: currency.code,
    symbol: currency.symbol,
    name: currency.name,
  }));

  await prisma.currency.createMany({
    data: currencies,
    skipDuplicates: true,
  });
  console.log('Currencies Seed Data initialized');
};

const initUsers = async () => {
  const users = seedData.users.map((user) => ({
    id: user.id,
    name: user.name,
  }));

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });
  console.log('Users Seed Data initialized');
};

const initProducts = async () => {
  const products = seedData.products.map((product) => ({
    id: product.id,
    name: product.name,
    amount: product.amount,
    currencyCode: product.currencyCode,
  }));

  await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });
  console.log('Products Seed Data initialized');
};

(async () => {
  await initCurrencies();
  await initUsers();
  await initProducts();
})();
