import { PrismaClient } from '@prisma/client';
import { EncryptionService } from 'util-encryption';

async function main() {
  const prisma = new PrismaClient();

  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  const encryption = new EncryptionService(process.env.ENCRYPTION_KEY);

  try {
    await prisma.$executeRaw`SELECT set_tenant_context(NULL)`;

    const users = await prisma.user.findMany({
      where: {
        phone: { not: null },
        phoneEncrypted: null,
      },
      select: {
        id: true,
        phone: true,
        tenantId: true,
      },
    });

    console.log(`Found ${users.length} users with unencrypted phone numbers`);

    if (users.length === 0) {
      console.log('No users to migrate. Exiting.');
      await prisma.$disconnect();
      return;
    }

    let encrypted = 0;
    let errors = 0;

    const batchSize = 100;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const batchNum = i / batchSize + 1;

      console.log(`Processing batch ${batchNum} (${batch.length} users)...`);

      for (const user of batch) {
        if (!user.phone) continue;

        try {
          const result = encryption.encryptPhone(user.phone);

          await prisma.user.update({
            where: { id: user.id },
            data: {
              phoneEncrypted: result.encrypted,
              phoneHash: result.hash,
            },
          });

          encrypted++;
        } catch (error) {
          console.error(`Failed to encrypt phone for user ${user.id}:`, error);
          errors++;
        }
      }

      if (i + batchSize < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log('Migration complete!');
    console.log(`Encrypted: ${encrypted} users`);
    console.log(`Errors: ${errors} users`);

    if (errors > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
