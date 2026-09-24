import { connectToDatabase, disconnectFromDatabase } from './database.js';
import { hashPassword } from '../modules/authentication/services/password.service.js';
import { OrganizationModel } from '../modules/organizations/models/organization.model.js';
import { UserModel } from '../modules/users/models/user.model.js';
import { env } from '../config/env.js';

const demoOrganization = {
  name: 'Laboratorio Demo',
  code: 'LAB-DEMO',
  timezone: 'America/Mexico_City',
  currency: 'MXN',
  active: true,
};

const seed = async (): Promise<void> => {
  if (!env.MONGODB_URI || env.MONGODB_URI.includes('<db_password>')) {
    throw new Error('A usable MONGODB_URI is required to run the development seed');
  }
  if (!env.SEED_ADMIN_PASSWORD) {
    throw new Error('SEED_ADMIN_PASSWORD is required to run the development seed');
  }

  await connectToDatabase();

  const organization = await OrganizationModel.findOneAndUpdate(
    { code: demoOrganization.code },
    { $setOnInsert: demoOrganization },
    { new: true, upsert: true, runValidators: true },
  ).exec();

  const passwordHash = await hashPassword(env.SEED_ADMIN_PASSWORD);
  await UserModel.findOneAndUpdate(
    { organizationId: organization._id, email: 'admin@laboratorio.demo' },
    {
      $set: {
        firstName: 'Admin',
        lastName: 'Demo',
        roles: ['admin'],
        active: true,
      },
      $setOnInsert: { passwordHash },
    },
    { upsert: true, setDefaultsOnInsert: true, runValidators: true },
  ).exec();

  console.log(`Seed completed for organization ${organization.code}`);
};

seed()
  .catch((error: unknown) => {
    console.error('Seed failed', error instanceof Error ? error.message : 'Unknown error');
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromDatabase();
  });
