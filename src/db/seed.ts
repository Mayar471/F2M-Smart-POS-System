import { db } from './index';
import { users, categories, products } from './schema';
import bcrypt from 'bcrypt';

async function main() {
  console.log('⏳ Starting database seeding...');

  console.log('🧹 Clearing existing data...');
  db.delete(products).run();
  db.delete(categories).run();
  db.delete(users).run();

  const saltRounds = 10;
  const managerPasswordHash = await bcrypt.hash('admin123', saltRounds);
  const cashierPasswordHash = await bcrypt.hash('cashier123', saltRounds);

  console.log('👤 Seeding users...');
  db.insert(users).values([
    {
      id: 'usr_manager_01',
      name: 'general manager',
      username: 'admin',
      passwordHash: managerPasswordHash,
      role: 'manager',
      createdAt: new Date(),
    },
    {
      id: 'usr_cashier_01',
      name: 'Ahmad Cashier',
      username: 'cashier',
      passwordHash: cashierPasswordHash,
      role: 'cashier',
      createdAt: new Date(),
    },
  ]).run();

  console.log('📂 Seeding categories...');
  db.insert(categories).values([
    { id: 'cat_burgers', name: 'Burgers', createdAt: new Date() },
    { id: 'cat_pizza', name: 'Pizza', createdAt: new Date() },
    { id: 'cat_drinks', name: 'Drinks', createdAt: new Date() },
  ]).run();

  console.log('🍔 Seeding products...');
  db.insert(products).values([
    { id: 'prod_b1', name: 'Classic Beef Burger', categoryId: 'cat_burgers', price: 5.5, isAvailable: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
    { id: 'prod_b2', name: 'Cheese Burger', categoryId: 'cat_burgers', price: 6.0, isAvailable: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
    { id: 'prod_p1', name: 'Margherita Pizza', categoryId: 'cat_pizza', price: 8.5, isAvailable: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
    { id: 'prod_p2', name: 'Pepperoni Pizza', categoryId: 'cat_pizza', price: 10.0, isAvailable: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
    { id: 'prod_d1', name: 'Coca Cola', categoryId: 'cat_drinks', price: 1.5, isAvailable: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
    { id: 'prod_d2', name: 'Fresh Orange Juice', categoryId: 'cat_drinks', price: 3.0, isAvailable: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  ]).run();

  console.log('✅ Seeding completed successfully!');
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});