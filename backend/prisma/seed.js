import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Wipe existing data
  await prisma.message.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.expenseParticipant.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database wiped.');

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.create({
    data: {
      fullName: 'Alice Smith',
      email: 'alice@demo.com',
      emailVerified: true,
      passwordHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      fullName: 'Bob Johnson',
      email: 'bob@demo.com',
      emailVerified: true,
      passwordHash,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      fullName: 'Charlie Davis',
      email: 'charlie@demo.com',
      emailVerified: true,
      passwordHash,
    },
  });

  console.log('Users created: Alice, Bob, Charlie');

  // 3. Create Groups
  const manaliTrip = await prisma.group.create({
    data: {
      name: 'Manali Trip',
      description: 'Expenses from the amazing Manali trip!',
      createdById: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
          { userId: charlie.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const flatExpenses = await prisma.group.create({
    data: {
      name: 'Flat Expenses',
      description: 'Monthly flat utilities and groceries.',
      createdById: bob.id,
      members: {
        create: [
          { userId: alice.id, role: 'MEMBER' },
          { userId: bob.id, role: 'ADMIN' },
        ],
      },
    },
  });

  const goaWeekend = await prisma.group.create({
    data: {
      name: 'Goa Weekend',
      description: 'Quick weekend getaway.',
      createdById: charlie.id,
      members: {
        create: [
          { userId: bob.id, role: 'MEMBER' },
          { userId: charlie.id, role: 'ADMIN' },
        ],
      },
    },
  });

  console.log('Groups created: Manali Trip, Flat Expenses, Goa Weekend');

  // 4. Add Expenses & Splits

  // Expense 1: Hotel in Manali (Paid by Alice, split equally 3 ways)
  const expense1Amount = 300;
  const split1 = expense1Amount / 3;
  const hotelExpense = await prisma.expense.create({
    data: {
      groupId: manaliTrip.id,
      title: 'Hotel Booking',
      amount: expense1Amount,
      paidById: alice.id,
      createdById: alice.id,
      splitType: 'EQUAL',
      category: 'ACCOMMODATION',
      participants: {
        create: [
          { userId: alice.id, splitValue: null, sortOrder: 0 },
          { userId: bob.id, splitValue: null, sortOrder: 1 },
          { userId: charlie.id, splitValue: null, sortOrder: 2 },
        ],
      },
      splits: {
        create: [
          { userId: alice.id, amountOwed: split1 },
          { userId: bob.id, amountOwed: split1 },
          { userId: charlie.id, amountOwed: split1 },
        ],
      },
    },
  });

  // Expense 2: Food in Manali (Paid by Bob, exact split: Alice 20, Bob 30, Charlie 50)
  const foodExpense = await prisma.expense.create({
    data: {
      groupId: manaliTrip.id,
      title: 'Dinner at Cafe',
      amount: 100,
      paidById: bob.id,
      createdById: bob.id,
      splitType: 'UNEQUAL',
      category: 'FOOD',
      participants: {
        create: [
          { userId: alice.id, splitValue: 20, sortOrder: 0 },
          { userId: bob.id, splitValue: 30, sortOrder: 1 },
          { userId: charlie.id, splitValue: 50, sortOrder: 2 },
        ],
      },
      splits: {
        create: [
          { userId: alice.id, amountOwed: 20 },
          { userId: bob.id, amountOwed: 30 },
          { userId: charlie.id, amountOwed: 50 },
        ],
      },
    },
  });

  // Expense 3: Transport in Manali (Paid by Charlie, split by shares: Alice 1, Bob 1) -> Total 2 shares
  const transportExpense = await prisma.expense.create({
    data: {
      groupId: manaliTrip.id,
      title: 'Taxi to Solang',
      amount: 40,
      paidById: charlie.id,
      createdById: charlie.id,
      splitType: 'SHARE',
      category: 'TRANSPORT',
      participants: {
        create: [
          { userId: alice.id, splitValue: 1, sortOrder: 0 },
          { userId: bob.id, splitValue: 1, sortOrder: 1 },
        ],
      },
      splits: {
        create: [
          { userId: alice.id, amountOwed: 20 },
          { userId: bob.id, amountOwed: 20 },
        ],
      },
    },
  });

  // Expense 4: Utilities in Flat (Paid by Bob, equal split with Alice)
  const utilExpense = await prisma.expense.create({
    data: {
      groupId: flatExpenses.id,
      title: 'Electricity Bill',
      amount: 60,
      paidById: bob.id,
      createdById: bob.id,
      splitType: 'EQUAL',
      category: 'UTILITIES',
      participants: {
        create: [
          { userId: alice.id, splitValue: null, sortOrder: 0 },
          { userId: bob.id, splitValue: null, sortOrder: 1 },
        ],
      },
      splits: {
        create: [
          { userId: alice.id, amountOwed: 30 },
          { userId: bob.id, amountOwed: 30 },
        ],
      },
    },
  });

  // Expense 5: Groceries in Flat (Paid by Alice, equal split)
  const groceriesExpense = await prisma.expense.create({
    data: {
      groupId: flatExpenses.id,
      title: 'Weekly Groceries',
      amount: 120,
      paidById: alice.id,
      createdById: alice.id,
      splitType: 'EQUAL',
      category: 'SHOPPING',
      participants: {
        create: [
          { userId: alice.id, splitValue: null, sortOrder: 0 },
          { userId: bob.id, splitValue: null, sortOrder: 1 },
        ],
      },
      splits: {
        create: [
          { userId: alice.id, amountOwed: 60 },
          { userId: bob.id, amountOwed: 60 },
        ],
      },
    },
  });

  console.log('Expenses created.');

  // 5. Add Settlements
  // Bob pays Alice $50 in Manali Trip
  const settlement1 = await prisma.settlement.create({
    data: {
      groupId: manaliTrip.id,
      payerId: bob.id,
      receiverId: alice.id,
      amount: 50,
      createdById: bob.id,
      note: 'Transfer for Hotel',
    },
  });

  console.log('Settlements created.');

  // 6. Add Chat Messages
  await prisma.message.create({
    data: {
      expenseId: hotelExpense.id,
      senderId: alice.id,
      message: 'I booked the hotel for 3 nights. Let me know if the price is okay.',
    },
  });

  await prisma.message.create({
    data: {
      expenseId: hotelExpense.id,
      senderId: charlie.id,
      message: 'Looks great! Thanks for booking.',
    },
  });

  console.log('Chat messages created.');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
