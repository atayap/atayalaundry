// lib/seed.ts
import db from './db';

const seedDatabase = () => {
  // Cek apakah user sudah ada
  const userCheck = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (userCheck.count === 0) {
    // Masukkan data Admin & Kasir default (Password masih plain text sederhana untuk tahap dev)
    const insertUser = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    insertUser.run('Administrator', 'admin@laundry.com', 'admin123', 'admin');
    insertUser.run('Kasir Utama', 'kasir@laundry.com', 'kasir123', 'kasir');
    console.log('✅ Default users created.');
  }

  // Cek apakah services sudah ada
  const serviceCheck = db.prepare('SELECT COUNT(*) as count FROM services').get() as { count: number };
  
  if (serviceCheck.count === 0) {
    const insertService = db.prepare('INSERT INTO services (service_name, unit, price_per_unit) VALUES (?, ?, ?)');
    insertService.run('Cuci Komplit (Cuci + Setrika)', 'kg', 7000);
    insertService.run('Setrika Saja', 'kg', 5000);
    insertService.run('Cuci Express 3 Jam', 'kg', 12000);
    insertService.run('Selimut / Bedcover', 'pcs', 15000);
    console.log('✅ Default services created.');
  }
};

seedDatabase();