const Parser = require('rss-parser');
const fs = require('fs');

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["enclosure", "enclosure"]
    ]
  }
});

let xmlText = fs.readFileSync('rss-output.xml', 'utf8');
xmlText = xmlText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
xmlText = xmlText.replace(/<img[^>]*>/gi, "");
xmlText = xmlText.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "");
xmlText = xmlText.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
xmlText = xmlText.replace(/&(?!(?:apos|quot|amp|lt|gt|#x[0-9a-fA-F]+|#[0-9]+);)/g, '&amp;');

parser.parseString(xmlText).then(res => console.log('success', res.items.length)).catch(console.error);
