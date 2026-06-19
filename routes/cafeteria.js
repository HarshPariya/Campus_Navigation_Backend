const express = require('express');
const router = express.Router();
const { DailyMenu, Order, MealPlan } = require('../models/Cafeteria');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Get today's menu
router.get('/menu', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let menu = await DailyMenu.findOne({ date: today });

    if (!menu) {
      // Create default menu if none exists
      menu = new DailyMenu({
        date: today,
        items: [],
        specials: []
      });
      await menu.save();
    }

    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get menu by date
router.get('/menu/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    const menu = await DailyMenu.findOne({ date });
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found for this date' });
    }

    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create/update menu (admin only)
router.post('/menu', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { date, items, specials } = req.body;
    const menuDate = new Date(date);
    menuDate.setHours(0, 0, 0, 0);

    let menu = await DailyMenu.findOne({ date: menuDate });

    if (menu) {
      menu.items = items || menu.items;
      menu.specials = specials || menu.specials;
      await menu.save();
    } else {
      menu = new DailyMenu({
        date: menuDate,
        items: items || [],
        specials: specials || []
      });
      await menu.save();
    }

    res.json(menu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user orders
router.get('/orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create order
router.post('/orders', protect, async (req, res) => {
  try {
    const { items, paymentMethod, mealPlanUsed, pickupTime } = req.body;

    // Calculate total
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const menu = await DailyMenu.findOne({ date: today });

    if (!menu) {
      return res.status(400).json({ message: 'Menu not available for today' });
    }

    let totalAmount = 0;
    const orderItems = items.map(item => {
      const menuItem = menu.items.find(m => m._id.toString() === item.itemId) ||
                      menu.specials.find(m => m._id.toString() === item.itemId);
      
      if (!menuItem) {
        throw new Error(`Item ${item.itemId} not found`);
      }

      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;

      return {
        itemId: item.itemId,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price
      };
    });

    // Check meal plan if used
    if (mealPlanUsed) {
      const mealPlan = await MealPlan.findOne({ userId: req.user.id });
      if (!mealPlan || mealPlan.mealsRemaining <= 0) {
        return res.status(400).json({ message: 'Insufficient meals in plan' });
      }
      mealPlan.mealsRemaining -= 1;
      await mealPlan.save();
    }

    const order = new Order({
      userId: req.user.id,
      items: orderItems,
      totalAmount,
      paymentMethod,
      mealPlanUsed,
      pickupTime: pickupTime ? new Date(pickupTime) : null
    });

    await order.save();

    // Notify user
    await Notification.create({
      userId: req.user.id,
      title: 'Order Placed',
      message: `Your order #${order._id} has been placed successfully`,
      type: 'system',
      category: 'success',
      link: `/cafeteria/orders/${order._id}`
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get meal plan
router.get('/meal-plan', protect, async (req, res) => {
  try {
    let mealPlan = await MealPlan.findOne({ userId: req.user.id });

    if (!mealPlan) {
      mealPlan = new MealPlan({
        userId: req.user.id,
        planType: 'monthly',
        mealsRemaining: 0,
        totalMeals: 0
      });
      await mealPlan.save();
    }

    res.json(mealPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update meal plan (admin only)
router.post('/meal-plan/:userId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    let mealPlan = await MealPlan.findOne({ userId: req.params.userId });

    if (mealPlan) {
      Object.assign(mealPlan, req.body);
      await mealPlan.save();
    } else {
      mealPlan = new MealPlan({
        userId: req.params.userId,
        ...req.body
      });
      await mealPlan.save();
    }

    res.json(mealPlan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

