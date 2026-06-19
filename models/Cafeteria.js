const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: String,
  isAvailable: {
    type: Boolean,
    default: true
  },
  ingredients: [String],
  allergens: [String],
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  }
});

const dailyMenuSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  items: [menuItemSchema],
  specials: [menuItemSchema]
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  pickupTime: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'meal-plan', 'online'],
    default: 'cash'
  },
  mealPlanUsed: {
    type: Boolean,
    default: false
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const mealPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  planType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  mealsRemaining: {
    type: Number,
    default: 0
  },
  totalMeals: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const DailyMenu = mongoose.model('DailyMenu', dailyMenuSchema);
const Order = mongoose.model('CafeteriaOrder', orderSchema);
const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

module.exports = { DailyMenu, Order, MealPlan };

