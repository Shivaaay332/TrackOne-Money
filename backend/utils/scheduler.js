const cron = require('node-cron');
const Udhari = require('../models/Udhari');
const Notification = require('../models/Notification');

const initScheduler = () => {
  // Run everyday at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('Running daily Udhari due date check...');
      const today = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(today.getDate() + 3);

      const dueUdharis = await Udhari.find({
        isSettled: false,
        dueDate: { $lte: threeDaysFromNow, $gte: today }
      });

      for (let udhari of dueUdharis) {
        await Notification.create({
          user: udhari.user,
          title: 'Upcoming Udhari Due Date',
          message: `Your ${udhari.type} record with ${udhari.personName} for ₹${udhari.amount} is due soon on ${new Date(udhari.dueDate).toLocaleDateString()}.`,
          type: 'Udhari Reminder'
        });
      }
    } catch (error) {
      console.error('Scheduler Error:', error);
    }
  });
};

module.exports = { initScheduler };