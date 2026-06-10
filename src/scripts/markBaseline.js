const { sequelize } = require('../models');
const fs = require('fs');
const path = require('path');
const run = async () => {
  await sequelize.query('CREATE TABLE IF NOT EXISTS "SequelizeMeta" (name VARCHAR(255) COLLATE "default" NOT NULL PRIMARY KEY);');
  const files = fs.readdirSync(path.join(__dirname, '../migrations'));
  for (const file of files) {
    if (file.endsWith('.js')) {
      await sequelize.query(`INSERT INTO "SequelizeMeta" (name) VALUES ('${file}') ON CONFLICT DO NOTHING;`);
      console.log('Inserted', file, 'into SequelizeMeta');
    }
  }
  process.exit(0);
};
run();
