import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Wipe existing data
  await prisma.importIssue.deleteMany();
  await prisma.importJob.deleteMany();
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

  const usersData = [
    { fullName: 'Aisha', email: 'aisha@demo.com', emailVerified: true, passwordHash },
    { fullName: 'Rohan', email: 'rohan@demo.com', emailVerified: true, passwordHash },
    { fullName: 'Priya', email: 'priya@demo.com', emailVerified: true, passwordHash },
    { fullName: 'Meera', email: 'meera@demo.com', emailVerified: true, passwordHash },
    { fullName: 'Dev', email: 'dev@demo.com', emailVerified: true, passwordHash },
    { fullName: 'Sam', email: 'sam@demo.com', emailVerified: true, passwordHash },
  ];

  const users = {};
  for (const data of usersData) {
    const user = await prisma.user.create({ data });
    users[user.fullName] = user;
  }

  console.log('Users created: Aisha, Rohan, Priya, Meera, Dev, Sam');

  // 3. Create Group & Members
  const flatmates = await prisma.group.create({
    data: {
      name: 'Flatmates',
      description: 'Shared expenses for the flat',
      createdById: users['Aisha'].id,
      members: {
        create: [
          { userId: users['Aisha'].id, role: 'ADMIN', joinedAt: new Date('2026-02-01T00:00:00Z') },
          { userId: users['Rohan'].id, role: 'MEMBER', joinedAt: new Date('2026-02-01T00:00:00Z') },
          { userId: users['Priya'].id, role: 'MEMBER', joinedAt: new Date('2026-02-01T00:00:00Z') },
          { 
            userId: users['Meera'].id, 
            role: 'MEMBER', 
            joinedAt: new Date('2026-02-01T00:00:00Z'),
            leftAt: new Date('2026-03-31T23:59:59Z') // Left end of March
          },
          { 
            userId: users['Dev'].id, 
            role: 'MEMBER', 
            joinedAt: new Date('2026-03-05T00:00:00Z'),
            leftAt: new Date('2026-03-15T23:59:59Z') // Joined only for the trip
          },
          { 
            userId: users['Sam'].id, 
            role: 'MEMBER', 
            joinedAt: new Date('2026-04-07T00:00:00Z') // Moved in mid-April
          },
        ],
      },
    },
  });

  console.log('Group created: Flatmates with date-based membership history.');
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
