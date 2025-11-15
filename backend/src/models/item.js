const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'uncategorized' },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: '' },
  purchased: { type: Boolean, default: false },
  purchaseCount: { type: Number, default: 0 },  // New: Track how many times purchased
  createdAt: { type: Date, default: Date.now }
});

// ✅ Use global caching to prevent OverwriteModelError
const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);
module.exports = Item;