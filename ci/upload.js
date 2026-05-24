/**
 * 微信小程序自动上传脚本
 * 使用 miniprogram-ci 将代码上传到微信后台
 * 
 * 环境变量：
 *   WX_APPID       - 小程序 AppID
 *   WX_PRIVATE_KEY - 代码上传密钥内容（base64 编码）
 * 
 * 使用方式：
 *   node ci/upload.js
 */

const ci = require('miniprogram-ci');
const fs = require('fs');
const path = require('path');

const PROJECT_PATH = path.resolve(__dirname, '..');

// 获取密钥
const appid = process.env.WX_APPID;
const privateKeyBase64 = process.env.WX_PRIVATE_KEY;

if (!appid || !privateKeyBase64) {
  console.error('❌ 缺少环境变量 WX_APPID 或 WX_PRIVATE_KEY');
  process.exit(1);
}

// 将 base64 密钥写入临时文件
const privateKeyPath = path.join(__dirname, 'private.key');
fs.writeFileSync(privateKeyPath, Buffer.from(privateKeyBase64, 'base64').toString('utf-8'));

// 获取版本号（基于当前时间）
const date = new Date();
const version = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
const desc = `CI 自动上传 - ${date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;

async function upload() {
  console.log(`\n📱 小程序上传准备`);
  console.log(`   AppID: ${appid}`);
  console.log(`   版本: ${version}`);
  console.log(`   描述: ${desc}`);
  console.log(`   路径: ${PROJECT_PATH}\n`);

  const project = new ci.Project({
    appid,
    type: 'miniProgram',
    projectPath: PROJECT_PATH,
    privateKeyPath,
    ignores: ['node_modules/**/*', '.git/**/*', '.github/**/*', 'ci/**/*', '*.md', 'package-lock.json'],
  });

  try {
    console.log('🔄 正在上传...');
    
    const uploadResult = await ci.upload({
      project,
      version,
      desc,
      setting: {
        es6: true,
        es7: true,
        minify: true,
        autoPrefixWXSS: true,
      },
      onProgressUpdate(info) {
        console.log(`   ⏳ ${info}`);
      },
    });

    console.log('\n✅ 上传成功！');
    console.log(JSON.stringify(uploadResult, null, 2));
  } catch (err) {
    console.error('\n❌ 上传失败:', err.message);
    process.exit(1);
  } finally {
    // 清理临时密钥文件
    if (fs.existsSync(privateKeyPath)) {
      fs.unlinkSync(privateKeyPath);
    }
  }
}

upload();
