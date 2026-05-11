#!/usr/bin/env node

const PDFDocument = require('/root/.openclaw/workspace/node_modules/pdfkit');
const fs = require('fs');
const path = require('path');

// 安装路径
const workspacePath = '/root/.openclaw/workspace';
const pdfkitPath = path.join(workspacePath, 'node_modules', 'pdfkit');

function generateFundReport(reportData, outputPath) {
  // 初始化PDF
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 50, right: 50 },
    info: {
      Title: reportData.title || '基金持仓分析报告',
      Author: 'FundPilot',
      Subject: '基金投资分析'
    }
  });
  
  doc.pipe(fs.createWriteStream(outputPath));
  
  // 加载中文字体
  const fontPaths = [
    '/usr/share/fonts/chinese/weiruan.ttf',
    '/usr/share/fonts/chinese/zpix.ttf'
  ];
  
  let hasChineseFont = false;
  for (const fontPath of fontPaths) {
    try {
      if (fs.existsSync(fontPath)) {
        doc.registerFont('Chinese', fontPath);
        doc.font('Chinese');
        hasChineseFont = true;
        console.log('使用中文字体:', fontPath);
        break;
      }
    } catch (e) {
      console.log('字体加载失败:', fontPath, e.message);
    }
  }
  
  // 生成报告内容
  // 标题
  doc.fontSize(22).text(reportData.title || '基金持仓分析报告', { align: 'center' });
  doc.moveDown(0.5);
  
  // 日期
  doc.fontSize(12).text(`分析日期: ${reportData.date || new Date().toLocaleDateString('zh-CN')}`, { align: 'center' });
  doc.moveDown(1);
  
  // 分隔线
  drawLine(doc);
  doc.moveDown(0.5);
  
  // 各部分内容
  if (reportData.sections) {
    for (const section of reportData.sections) {
      // 章节标题
      doc.fontSize(16).text(section.title);
      doc.moveDown(0.3);
      
      // 章节内容
      doc.fontSize(11);
      
      if (section.type === 'table' && section.data) {
        // 表格数据
        for (const row of section.data) {
          const rowText = row.join(' | ');
          doc.text(rowText, { indent: 10 });
        }
      } else if (section.content) {
        // 文本内容
        const lines = section.content.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
            doc.text(line.trim(), { indent: 20 });
          } else if (line.trim()) {
            doc.text(line.trim());
          }
        }
      }
      
      doc.moveDown(0.5);
      drawLine(doc);
      doc.moveDown(0.5);
    }
  }
  
  // 总结
  if (reportData.summary) {
    doc.fontSize(16).text('总结');
    doc.moveDown(0.3);
    
    doc.fontSize(11).text(reportData.summary);
  }
  
  // 页脚
  doc.fontSize(10).text('本报告仅供参考，不构成投资建议。投资有风险，决策需谨慎。', { align: 'center' });
  
  doc.end();
  return outputPath;
}

function drawLine(doc) {
  doc.strokeColor('#cccccc').lineWidth(0.5)
    .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
}

// CLI使用
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('使用方法: node generate_report_pdf.js <input.json> <output.pdf>');
    console.log('或: node generate_report_pdf.js --markdown <input.md> <output.pdf>');
    process.exit(1);
  }
  
  let reportData;
  let outputPath;
  
  if (args[0] === '--markdown') {
    // Markdown输入
    const mdPath = args[1];
    outputPath = args[2] || mdPath.replace('.md', '.pdf');
    
    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    
    // 简单解析Markdown
    reportData = {
      title: '基金持仓分析报告',
      date: new Date().toLocaleDateString('zh-CN'),
      sections: parseMarkdown(mdContent)
    };
  } else {
    // JSON输入
    const jsonPath = args[0];
    outputPath = args[1];
    reportData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  }
  
  generateFundReport(reportData, outputPath);
  console.log(`✅ PDF报告已生成: ${outputPath}`);
}

function parseMarkdown(md) {
  const sections = [];
  const lines = md.split('\n');
  let currentSection = null;
  let contentBuffer = [];
  
  for (const line of lines) {
    if (line.startsWith('# ') && !currentSection) {
      // 主标题，跳过
      continue;
    }
    
    if (line.startsWith('## ')) {
      // 新章节
      if (currentSection) {
        currentSection.content = contentBuffer.join('\n');
        sections.push(currentSection);
      }
      currentSection = { title: line.slice(3), type: 'text', content: '' };
      contentBuffer = [];
    } else if (line.includes('|') && line.startsWith('|')) {
      // 表格行
      if (currentSection && currentSection.type !== 'table') {
        currentSection.content = contentBuffer.join('\n');
        sections.push(currentSection);
        currentSection = { title: currentSection.title, type: 'table', data: [] };
        contentBuffer = [];
      }
      if (!currentSection) {
        currentSection = { title: '表格数据', type: 'table', data: [] };
      }
      
      // 解析表格行（跳过分隔行）
      if (!line.includes('---')) {
        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
        if (cells.length > 0) {
          currentSection.data.push(cells);
        }
      }
    } else if (line.startsWith('---')) {
      // 分隔线
      if (currentSection) {
        if (currentSection.type === 'text') {
          currentSection.content = contentBuffer.join('\n');
        }
        sections.push(currentSection);
        currentSection = null;
        contentBuffer = [];
      }
    } else if (line.trim() && currentSection) {
      contentBuffer.push(line);
    }
  }
  
  // 最后一节
  if (currentSection) {
    if (currentSection.type === 'text') {
      currentSection.content = contentBuffer.join('\n');
    }
    sections.push(currentSection);
  }
  
  return sections;
}

module.exports = { generateFundReport };