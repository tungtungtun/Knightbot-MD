const fs = require('fs');
const path = require('path');

// Function to load user and group data from JSON file
function loadUserGroupData() {
    try {
        const dataPath = path.join(__dirname, '../data/userGroupData.json');
        if (!fs.existsSync(dataPath)) {
            // Create the file with default structure if it doesn't exist
            const defaultData = {
                antibadword: {},
                antilink: {},
                welcome: {},
                goodbye: {},
                chatbot: {},
                warnings: {}
            };
            fs.writeFileSync(dataPath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        return data;
    } catch (error) {
        console.error('Error loading user group data:', error);
        return {
            antibadword: {},
            antilink: {},
            welcome: {},
            goodbye: {},
            chatbot: {},
            warnings: {}
        };
    }
}

// Function to save user and group data to JSON file
function saveUserGroupData(data) {
    try {
        const dataPath = path.join(__dirname, '../data/userGroupData.json');
        // Ensure the directory exists
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving user group data:', error);
        return false;
    }
}

async function handleAddContacts(bot, message) {
    const fs = require("fs");
const path = require("path");

function parseVCF(text) {
  const entries = text.split("BEGIN:VCARD").slice(1);
  const numbers = [];
  for (const entry of entries) {
    const match = entry.match(/TEL.*:(\\+?\\d+)/);
    if (match) numbers.push(match[1].replace(/\\D/g, ""));
  }
  return numbers;
}

async function handleAddContacts(bot, message) {
  const quoted = message.quoted;

  if (!quoted || quoted.mtype !== "documentMessage") {
    return bot.sendMessage(message.chat, {
      text: "❌ Reply to a .txt or .vcf contact file with /add"
    });
  }

  const fileName = quoted.message.documentMessage.fileName || "contacts.txt";
  const filePath = path.join(__dirname, "..", "uploads", fileName);

  const buffer = await bot.downloadMediaMessage(quoted);
  fs.writeFileSync(filePath, buffer);

  const raw = fs.readFileSync(filePath, "utf-8");
  let numbers = [];

  if (fileName.endsWith(".vcf")) {
    numbers = parseVCF(raw);
  } else if (fileName.endsWith(".txt")) {
    numbers = raw
      .split(/\\r?\\n/)
      .map((n) => n.replace(/\\D/g, ""))
      .filter((n) => n.length > 6);
  } else {
    return bot.sendMessage(message.chat, {
      text: "❌ Unsupported file type. Use .txt or .vcf"
    });
  }

  const jids = numbers.map((n) => `${n}@s.whatsapp.net`);
  for (let i = 0; i < jids.length; i += 10) {
    const chunk = jids.slice(i, i + 10);
    await bot.groupParticipantsUpdate(message.chat, chunk, "add").catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));
  }

  return bot.sendMessage(message.chat, {
    text: `✅ Added ${jids.length} contacts to this group.`
  });
}
  // logic: check file type, extract contacts, add to group
}


// Add these functions to your SQL helper file
async function setAntilink(groupId, type, action) {
    try {
        const data = loadUserGroupData();
        if (!data.antilink) data.antilink = {};
        if (!data.antilink[groupId]) data.antilink[groupId] = {};
        
        data.antilink[groupId] = {
            enabled: type === 'on',
            action: action || 'delete' // Set default action to delete
        };
        
        saveUserGroupData(data);
        return true;
    } catch (error) {
        console.error('Error setting antilink:', error);
        return false;
    }
}

async function getAntilink(groupId, type) {
    try {
        const data = loadUserGroupData();
        if (!data.antilink || !data.antilink[groupId]) return null;
        
        return type === 'on' ? data.antilink[groupId] : null;
    } catch (error) {
        console.error('Error getting antilink:', error);
        return null;
    }
}

async function removeAntilink(groupId, type) {
    try {
        const data = loadUserGroupData();
        if (data.antilink && data.antilink[groupId]) {
            delete data.antilink[groupId];
            saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error removing antilink:', error);
        return false;
    }
}

// Add these functions for warning system
async function incrementWarningCount(groupId, userId) {
    try {
        const data = loadUserGroupData();
        if (!data.warnings) data.warnings = {};
        if (!data.warnings[groupId]) data.warnings[groupId] = {};
        if (!data.warnings[groupId][userId]) data.warnings[groupId][userId] = 0;
        
        data.warnings[groupId][userId]++;
        saveUserGroupData(data);
        return data.warnings[groupId][userId];
    } catch (error) {
        console.error('Error incrementing warning count:', error);
        return 0;
    }
}

async function resetWarningCount(groupId, userId) {
    try {
        const data = loadUserGroupData();
        if (data.warnings && data.warnings[groupId] && data.warnings[groupId][userId]) {
            data.warnings[groupId][userId] = 0;
            saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error resetting warning count:', error);
        return false;
    }
}

// Add sudo check function
async function isSudo(userId) {
    try {
        const data = loadUserGroupData();
        return data.sudo && data.sudo.includes(userId);
    } catch (error) {
        console.error('Error checking sudo:', error);
        return false;
    }
}

// Add these functions
async function addWelcome(jid, enabled, message) {
    try {
        const data = loadUserGroupData();
        if (!data.welcome) data.welcome = {};
        
        data.welcome[jid] = {
            enabled: enabled,
            message: message || 'Welcome {user} to the group! 🎉'
        };
        
        saveUserGroupData(data);
        return true;
    } catch (error) {
        console.error('Error in addWelcome:', error);
        return false;
    }
}

async function delWelcome(jid) {
    try {
        const data = loadUserGroupData();
        if (data.welcome && data.welcome[jid]) {
            delete data.welcome[jid];
            saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error in delWelcome:', error);
        return false;
    }
}

async function isWelcomeOn(jid) {
    try {
        const data = loadUserGroupData();
        return data.welcome && data.welcome[jid] && data.welcome[jid].enabled;
    } catch (error) {
        console.error('Error in isWelcomeOn:', error);
        return false;
    }
}

async function addGoodbye(jid, enabled, message) {
    try {
        const data = loadUserGroupData();
        if (!data.goodbye) data.goodbye = {};
        
        data.goodbye[jid] = {
            enabled: enabled,
            message: message || 'Goodbye {user} 👋'
        };
        
        saveUserGroupData(data);
        return true;
    } catch (error) {
        console.error('Error in addGoodbye:', error);
        return false;
    }
}

async function delGoodBye(jid) {
    try {
        const data = loadUserGroupData();
        if (data.goodbye && data.goodbye[jid]) {
            delete data.goodbye[jid];
            saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error in delGoodBye:', error);
        return false;
    }
}

async function isGoodByeOn(jid) {
    try {
        const data = loadUserGroupData();
        return data.goodbye && data.goodbye[jid] && data.goodbye[jid].enabled;
    } catch (error) {
        console.error('Error in isGoodByeOn:', error);
        return false;
    }
}

// Add these functions to your existing SQL helper file
async function setAntiBadword(groupId, type, action) {
    try {
        const data = loadUserGroupData();
        if (!data.antibadword) data.antibadword = {};
        if (!data.antibadword[groupId]) data.antibadword[groupId] = {};
        
        data.antibadword[groupId] = {
            enabled: type === 'on',
            action: action || 'delete'
        };
        
        saveUserGroupData(data);
        return true;
    } catch (error) {
        console.error('Error setting antibadword:', error);
        return false;
    }
}

async function getAntiBadword(groupId, type) {
    try {
        const data = loadUserGroupData();
        //console.log('Loading antibadword config for group:', groupId);
        //console.log('Current data:', data.antibadword);
        
        if (!data.antibadword || !data.antibadword[groupId]) {
            console.log('No antibadword config found');
            return null;
        }
        
        const config = data.antibadword[groupId];
       // console.log('Found config:', config);
        
        return type === 'on' ? config : null;
    } catch (error) {
        console.error('Error getting antibadword:', error);
        return null;
    }
}

async function removeAntiBadword(groupId, type) {
    try {
        const data = loadUserGroupData();
        if (data.antibadword && data.antibadword[groupId]) {
            delete data.antibadword[groupId];
            saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error removing antibadword:', error);
        return false;
    }
}

async function setChatbot(groupId, enabled) {
    try {
        const data = loadUserGroupData();
        if (!data.chatbot) data.chatbot = {};
        
        data.chatbot[groupId] = {
            enabled: enabled
        };
        
        saveUserGroupData(data);
        return true;
    } catch (error) {
        console.error('Error setting chatbot:', error);
        return false;
    }
}

async function getChatbot(groupId) {
    try {
        const data = loadUserGroupData();
        return data.chatbot?.[groupId] || null;
    } catch (error) {
        console.error('Error getting chatbot:', error);
        return null;
    }
}

async function removeChatbot(groupId) {
    try {
        const data = loadUserGroupData();
        if (data.chatbot && data.chatbot[groupId]) {
            delete data.chatbot[groupId];
            saveUserGroupData(data);
        }
        return true;
    } catch (error) {
        console.error('Error removing chatbot:', error);
        return false;
    }
}

module.exports = {
    // ... existing exports
    setAntilink,
    getAntilink,
    removeAntilink,
    incrementWarningCount,
    resetWarningCount,
    isSudo,
    addWelcome,
    delWelcome,
    isWelcomeOn,
    addGoodbye,
    delGoodBye,
    isGoodByeOn,
    setAntiBadword,
    getAntiBadword,
    removeAntiBadword,
    setChatbot,
    getChatbot,
    removeChatbot,
}; 
