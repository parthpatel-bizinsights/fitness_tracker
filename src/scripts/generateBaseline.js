const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

const generateMigration = () => {
  let upContent = 'module.exports = {\n  up: async (queryInterface, Sequelize) => {\n';
  let downContent = '  down: async (queryInterface, Sequelize) => {\n';

  for (const modelName of Object.keys(sequelize.models)) {
    const model = sequelize.models[modelName];
    const attributes = model.getAttributes();
    const tableName = model.tableName;

    upContent += `    await queryInterface.createTable('${tableName}', {\n`;
    for (const key of Object.keys(attributes)) {
      const attr = attributes[key];
      upContent += `      ${key}: {\n`;
      upContent += `        type: Sequelize.${attr.type.key || 'STRING'},\n`;
      if (attr.primaryKey) upContent += `        primaryKey: true,\n`;
      if (attr.autoIncrement) upContent += `        autoIncrement: true,\n`;
      if (attr.allowNull === false) upContent += `        allowNull: false,\n`;
      if (attr.unique) upContent += `        unique: true,\n`;
      upContent += `      },\n`;
    }
    upContent += `    });\n\n`;
    downContent += `    await queryInterface.dropTable('${tableName}');\n`;
  }

  upContent += '  },\n';
  downContent += '};\n';

  const finalCode = upContent + downContent;
  const dir = path.join(__dirname, '../migrations');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const filePath = path.join(dir, `${timestamp}-baseline.js`);
  fs.writeFileSync(filePath, finalCode);
  console.log('Generated baseline migration at', filePath);
  process.exit(0);
};

generateMigration();
