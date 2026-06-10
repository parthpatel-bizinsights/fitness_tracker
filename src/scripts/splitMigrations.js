require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

const run = async () => {
  const migrationsDir = path.join(__dirname, '../migrations');
  
  // 1. Delete old monolithic migrations
  if (fs.existsSync(migrationsDir)) {
    const oldFiles = fs.readdirSync(migrationsDir);
    for (const f of oldFiles) {
      if (f.endsWith('.js')) fs.unlinkSync(path.join(migrationsDir, f));
    }
  } else {
    fs.mkdirSync(migrationsDir);
  }

  // 2. Wipe SequelizeMeta
  await sequelize.query('TRUNCATE TABLE "SequelizeMeta";').catch(e => console.log('SequelizeMeta not found or empty'));

  // 3. Generate individual files
  const models = Object.keys(sequelize.models);
  let timeOffset = 0;

  for (const modelName of models) {
    const model = sequelize.models[modelName];
    const attributes = model.getAttributes();
    const tableName = model.tableName;

    let upContent = `module.exports = {\n  up: async (queryInterface, Sequelize) => {\n`;
    let downContent = `  down: async (queryInterface, Sequelize) => {\n`;

    upContent += `    await queryInterface.createTable('${tableName}', {\n`;
    for (const key of Object.keys(attributes)) {
      const attr = attributes[key];
      upContent += `      ${key}: {\n`;
      upContent += `        type: Sequelize.${attr.type.key || 'STRING'},\n`;
      if (attr.primaryKey) upContent += `        primaryKey: true,\n`;
      if (attr.autoIncrement) upContent += `        autoIncrement: true,\n`;
      if (attr.allowNull === false) upContent += `        allowNull: false,\n`;
      if (attr.unique) upContent += `        unique: true,\n`;
      if (attr.defaultValue !== undefined) {
        if (attr.defaultValue === sequelize.Sequelize.UUIDV4) {
          // Can't cleanly dump Sequelize functions into string, just ignore defaults for baseline or mock it
        }
      }
      upContent += `      },\n`;
    }
    upContent += `    });\n`;
    upContent += `  },\n`;
    downContent += `    await queryInterface.dropTable('${tableName}');\n  }\n};\n`;

    const finalCode = upContent + downContent;
    
    // Generate unique timestamp
    const now = new Date();
    now.setSeconds(now.getSeconds() + timeOffset);
    timeOffset += 1;
    const ts = now.toISOString().replace(/\D/g, '').slice(0, 14);
    
    const fileName = `${ts}-create-${tableName}.js`;
    const filePath = path.join(migrationsDir, fileName);
    
    fs.writeFileSync(filePath, finalCode);
    console.log(`Created migration: ${fileName}`);
    
    // 4. Mark in SequelizeMeta
    await sequelize.query(`INSERT INTO "SequelizeMeta" (name) VALUES ('${fileName}') ON CONFLICT DO NOTHING;`);
  }

  // 5. Delete seeders
  const seedersDir = path.join(__dirname, '../seeders');
  if (fs.existsSync(seedersDir)) {
    const seederFiles = fs.readdirSync(seedersDir);
    for (const f of seederFiles) {
      if (f.endsWith('.js')) {
        fs.unlinkSync(path.join(seedersDir, f));
        console.log(`Deleted seeder: ${f}`);
      }
    }
  }

  console.log("Migration splitting and seeder cleanup complete!");
  process.exit(0);
};

run();
