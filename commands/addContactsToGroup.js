const fs = require("fs");
const path = require("path");

const parseVCFContacts = (vcfText) => {
  const entries = vcfText.split("BEGIN:VCARD").slice(1);
  const numbers = [];
  for (const entry of entries) {
    const match = entry.match(/TEL.*:(\\+?\\d+)/);
    if (match) numbers.push(match[1].replace(/\\D/g, ""));
  }
  return numbers;
};

async function addContactsToGroup(bot, message) {
  const chatId = message.chatId;
  const quoted = message.quotedMsg;

  if (!quoted || quoted.type !== "document") {
    return bot.sendText(chatId, "❌ Reply to a contact file (.txt or .vcf) with /add");
  }

  const media = await bot.decryptFile(quoted);
  const fileName = quoted.filename || `contacts-${Date.now()}`;
  const filePath = path.join(__dirname, "uploads", fileName);
  fs.writeFileSync(filePath, media);

  let raw = fs.readFileSync(filePath, "utf-8");
  let numbers = [];

  if (filePath.endsWith(".vcf")) {
    numbers = parseVCFContacts(raw);
  } else if (filePath.endsWith(".txt")) {
    numbers = raw.split(/\\r?\\n/).map(n => n.replace(/\\D/g, "")).filter(n => n);
  } else {
    return bot.sendText(chatId, "❌ Unsupported file type.");
  }

  const jids = numbers.map(n => `${n}@c.us`);

  for (let i = 0; i < jids.length; i += 10) {
    const chunk = jids.slice(i, i + 10);
    await bot.addParticipant(chatId, chunk);
    await new Promise((r) => setTimeout(r, 1500));
  }

  return bot.sendText(chatId, `✅ Added ${jids.length} contacts to this group.`);
}
