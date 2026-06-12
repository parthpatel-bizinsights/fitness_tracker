const sequelize = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='Users' AND column_name='pushSubscription';
    `);

    if (results.length === 0) {
      await sequelize.query('ALTER TABLE "Users" ADD COLUMN "pushSubscription" JSON;');
      console.log('Added pushSubscription column');
    } else {
      console.log('Column already exists');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}
run();
