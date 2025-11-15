const Item = require('../models/Item');

exports.addItem = async (req, res, next) => {
  try {
    let { name, quantity = 1, category = 'uncategorized', unit = '' } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ error: 'Item name is required' });

    // Normalize the name for case-insensitive comparison
    
    name = name.trim().toLowerCase().replace(/[^\w\s]/gi, "");


    // Try to find existing item (case-insensitive)
    let existingItem = await Item.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });

    if (existingItem) {
      // ✅ If found, increment quantity
      existingItem.quantity += quantity;
      await existingItem.save();
      return res.json({
        action: 'updated',
        item: existingItem,
        message: `Quantity updated for ${existingItem.name}`,
      });
    }

    // ✅ Otherwise, create new item
    const newItem = await Item.create({ name, quantity, category, unit });
    return res.status(201).json({
      action: 'created',
      item: newItem,
      message: `New item added: ${newItem.name}`,
    });
  } catch (err) {
    next(err);
  }
};


exports.getItems = async (req, res, next) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const item = await Item.findByIdAndUpdate(id, updates, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    // ✅ If marking as purchased, increment purchaseCount for history
    if (updates.purchased === true) {
      item.purchaseCount += 1;
      await item.save();
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.getSuggestions = async (req, res, next) => {
  try {
    // 1. History-based: Top 3 most purchased items (not already in current list)
    const historySuggestions = await Item.find({ purchased: true })
      .sort({ purchaseCount: -1 })
      .limit(3)
      .select('name');

    // 2. Seasonal: Based on current month
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    let seasonalItems = [];

    if (month >= 12 || month <= 2) {
      seasonalItems = ['pumpkin', 'hot chocolate', 'cranberries']; // Winter
    } else if (month >= 3 && month <= 5) {
      seasonalItems = ['strawberries', 'asparagus', 'lettuce']; // Spring
    } else if (month >= 6 && month <= 8) {
      seasonalItems = ['watermelon', 'corn', 'peaches']; // Summer
    } else {
      seasonalItems = ['apples', 'squash', 'cinnamon']; // Fall
    }

    // 3. Substitutes: We'll handle this in the frontend when adding items (see below)

    res.json({
      history: historySuggestions.map(i => i.name),
      seasonal: seasonalItems,
      substitutes: {} // Placeholder; handled per-item in frontend
    });
  } catch (err) {
    next(err);
  }
};