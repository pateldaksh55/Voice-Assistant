const Item = require("../models/item");
const nlp = require('compromise');
const LibreTranslate = require('libretranslate');  // Correct package name

// Optional: Load plugins for better number/quantity handling
nlp.extend(require('compromise-numbers'));
nlp.extend(require('compromise-sentences'));

// Add substitutes mapping (for smart suggestions)
const substitutesMap = {
  milk: ['almond milk', 'oat milk', 'soy milk'],
  bread: ['whole wheat bread', 'gluten-free bread'],
  eggs: ['egg whites', 'tofu scramble'],
  // Add more as needed
};

// Language-specific keyword mappings
const languageKeywords = {
  en: {
    remove: ['remove', 'delete', 'clear', 'take out', 'eliminate', 'get rid of'],
    add: ['add', 'buy', 'get', 'need', 'put'],
    update: ['reduce', 'decrease', 'lower', 'set', 'change', 'increase', 'raise', 'add to', 'subtract'],
    set: ['set', 'change', 'to'],
    by: ['by']
  },
  es: {  // Spanish
    remove: ['eliminar', 'borrar', 'quitar', 'sacar', 'remover'],
    add: ['agregar', 'comprar', 'obtener', 'necesitar', 'poner'],
    update: ['reducir', 'disminuir', 'bajar', 'establecer', 'cambiar', 'aumentar', 'elevar', 'agregar a', 'restar'],
    set: ['establecer', 'cambiar', 'a'],
    by: ['por']
  },
  fr: {  // French
    remove: ['supprimer', 'effacer', 'retirer', 'enlever', 'éliminer'],
    add: ['ajouter', 'acheter', 'obtenir', 'avoir besoin', 'mettre'],
    update: ['réduire', 'diminuer', 'baisser', 'définir', 'changer', 'augmenter', 'élever', 'ajouter à', 'soustraire'],
    set: ['définir', 'changer', 'à'],
    by: ['par']
  },
  // Add more languages as needed (e.g., de: { remove: ['entfernen', 'löschen'], ... } for German)
};

exports.parseCommand = async (req, res) => {
  const { text = "", language = "en" } = req.body;
  console.log("🔥 BACKEND RECEIVED TEXT:", text, "Language:", language);

  if (!text) return res.status(400).json({ error: "text required" });

  try {
    // Step 1: Use compromise for NLP parsing
    let doc = nlp(text);

    // Extract quantity (numbers like "2", "two")
    let quantity = 1;
    const numbers = doc.numbers().out('array');
    console.log("🔢 Raw numbers output:", numbers);  // Temporary: Check plugin output
    console.log("🔢 Numbers extracted from text:", numbers);  // Add this for debugging

    // Manual mapping for number words (fallback if compromise-numbers fails)
    const numberWords = {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20
    };

    if (numbers.length > 0) {
      let extracted = numbers[0];
      if (typeof extracted === 'number') {
        quantity = extracted;  // Already a number (e.g., from "2")
      } else if (typeof extracted === 'string') {
        // Try to parse as number or map from words
        let parsed = parseFloat(extracted.replace(/[^\d.]/g, ''));  // Remove non-numeric chars (e.g., "two." -> "")
        if (!isNaN(parsed)) {
          quantity = parsed;
        } else {
          // Fallback to word mapping
          const word = extracted.toLowerCase().replace(/[^\w]/g, '');  // Clean "two." to "two"
          quantity = numberWords[word] || 1;
        }
      }
    }

    // Step 2: Extract nouns (potential items) - filter out common non-item words and detected keywords
    let nouns = doc.nouns().out('array').filter(noun => 
      !['i', 'you', 'it', 'we', 'they', 'this', 'that', 'list', 'shopping', 'item'].includes(noun.toLowerCase())
    );

    // Get keywords for the specified language (default to English)
    const keywords = languageKeywords[language] || languageKeywords['en'];
    const lowerText = text.toLowerCase();

    // Additionally, filter out keywords from the detected language to avoid including commands in item names
    const allKeywords = [
      ...keywords.remove, ...keywords.add, ...keywords.update, ...keywords.set, ...keywords.by
    ];
    nouns = nouns.filter(noun => !allKeywords.some(keyword => lowerText.includes(keyword) && noun.toLowerCase().includes(keyword.toLowerCase())));

    // If no nouns after filtering, fall back to basic extraction (remove punctuation and keywords)
    let itemName = nouns.length > 0 ? nouns[0] : text.replace(/[^\w\s]/gi, "").trim();

    // Remove any remaining keywords from the item name
    allKeywords.forEach(keyword => {
      itemName = itemName.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '').trim();
    });

    // Normalize: lowercase, trim, remove punctuation
    itemName = itemName.trim().toLowerCase().replace(/[^\w\s]/gi, "").trim();

    // Translate item name to English if in another language (universal solution with LibreTranslate)
    console.log(`🌐 Before translation: itemName=${itemName}, language=${language}`);
    if (language !== 'en' && itemName !== 'unknown') {
      try {
        console.log(`🌐 Attempting LibreTranslate for: ${itemName} from ${language} to en`);
        const result = await LibreTranslate.translate(itemName, language, 'en');
        console.log(`🌐 LibreTranslate result: ${result}`);
        itemName = result.toLowerCase().trim();
        console.log(`🌐 After translation: itemName=${itemName}`);
      } catch (err) {
        console.error("❌ LibreTranslate failed:", err.message, "Using original:", itemName);
        // Fallback to original itemName
      }
    } else {
      console.log(`🌐 No translation needed: language=${language}, itemName=${itemName}`);
    }

    if (!itemName) itemName = "unknown";

    // Step 3: Detect intent (multi-language support)
    console.log("🔍 Lower text for matching:", lowerText);  // Log the text being checked
    console.log("🔍 Keywords for language", language, ":", keywords);  // Log the selected keywords

    let intent = "add_item";  // Default
    let updateType = null;  // For updates: 'set' or 'adjust'
    let adjustAmount = 0;  // For relative adjustments (e.g., "reduce by 2")

    // Check for remove/delete
    if (keywords.remove.some(word => lowerText.includes(word))) {
      intent = "delete_item";
    }
    // Check for add/buy
    else if (keywords.add.some(word => lowerText.includes(word))) {
      intent = "add_item";
    }
    // Check for update/set/reduce/increase
    else if (keywords.update.some(word => lowerText.includes(word))) {
      intent = "update_quantity";
      if (keywords.set.some(word => lowerText.includes(word))) {
        updateType = 'set';  // e.g., "set to 2" or "reduce to 2"
      } else if (keywords.by.some(word => lowerText.includes(word))) {
        updateType = 'adjust';  // e.g., "reduce by 2" (relative)
        // For relative, parse the adjustment (positive for increase, negative for reduce)
        if (keywords.update.slice(0, 3).some(word => lowerText.includes(word))) {  // reduce/decrease/lower
          adjustAmount = -quantity;
        } else if (keywords.update.slice(5, 7).some(word => lowerText.includes(word))) {  // increase/raise
          adjustAmount = quantity;
        }
      } else {
        // Fallback: assume "reduce/increase to X" as set
        updateType = 'set';
      }
    }

    console.log(`🧠 Detected intent: ${intent}, item: ${itemName}, quantity: ${quantity}, updateType: ${updateType}, adjustAmount: ${adjustAmount}, language: ${language}`);

    let item;

    if (intent === "add_item") {
      // Existing logic: add or increment
      const normalized = itemName.trim().toLowerCase();
      let category = "other";
      if (/milk|cheese|butter|yogurt/.test(normalized)) category = "dairy";
      else if (/apple|banana|tomato|onion|carrot|potato/.test(normalized)) category = "produce";
      else if (/chicken|beef|mutton|fish|egg/.test(normalized)) category = "meat";
      else if (/chips|biscuit|chocolate|cookie|snack/.test(normalized)) category = "snacks";
      else if (/rice|pasta|flour|sugar|salt|oil|bread/.test(normalized)) category = "pantry";

      item = await Item.findOne({ name: { $regex: `^${normalized}$`, $options: "i" } });

      if (item) {
        item.quantity += quantity;
        await item.save();
        console.log(`✅ Updated existing item: ${item.name}, new qty: ${item.quantity}`);
        const substitutes = substitutesMap[normalized] || [];
        return res.json({
          action: "updated",
          item,
          substitutes,
          message: `Updated ${item.name}: total ${item.quantity}`,
        });
      } else {
        item = await Item.create({ name: normalized, quantity, category });
        console.log(`🆕 Added new item: ${item.name} (${quantity})`);
        const substitutes = substitutesMap[normalized] || [];
        return res.json({
          action: "created",
          item,
          substitutes,
          message: `Added ${quantity} ${item.name}`,
        });
      }
    }

    if (intent === "delete_item") {
      item = await Item.findOneAndDelete({ name: { $regex: `^${itemName}$`, $options: "i" } });
      if (!item) return res.json({ action: "not_found", item: itemName, message: `Item ${itemName} not found` });
      console.log(`🗑️ Deleted item: ${itemName}`);
      return res.json({ action: "deleted", item, message: `Deleted ${item.name}` });
    }

    if (intent === "update_quantity") {
      const normalized = itemName.trim().toLowerCase();
      item = await Item.findOne({ name: { $regex: `^${normalized}$`, $options: "i" } });

      if (!item) {
        return res.json({ action: "not_found", item: itemName, message: `Item ${itemName} not found to update` });
      }

      if (updateType === 'set') {
        item.quantity = quantity;  // Set to exact value
      } else if (updateType === 'adjust') {
        item.quantity = Math.max(0, item.quantity + adjustAmount);  // Adjust relatively, prevent negative
      }

      await item.save();
      console.log(`🔄 Updated quantity for ${item.name}: new qty ${item.quantity}`);
      const substitutes = substitutesMap[normalized] || [];
      return res.json({
        action: "quantity_updated",
        item,
        substitutes,
        message: `Updated ${item.name} quantity to ${item.quantity}`,
      });
    }

    return res.json({ message: "No valid action found" });
  } catch (err) {
    console.error("❌ Parse error:", err.message);
    return res.status(500).json({ error: "NLP failed" });
  }
};