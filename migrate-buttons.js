// Migration script to update existing buttons from 'amount' to 'amountUsd'
const mongoose = require('mongoose');

// Define the Button schema (old format)
const ButtonSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  amount: { type: Number },
  amountUsd: { type: Number },
  chainId: [{ type: String, required: true }],
  merchantAddress: { type: String, required: true },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }],
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  strict: false // Allow both old and new fields
});

const Button = mongoose.model("Button", ButtonSchema);

async function migrateButtons() {
  try {
    // Connect to MongoDB
    const mongoURL = process.env.MONGO_URL || 'mongodb://localhost:27017/crypto-checkout';
    await mongoose.connect(mongoURL);
    console.log('Connected to MongoDB');

    // Find all buttons that have 'amount' but not 'amountUsd'
    const buttonsToMigrate = await Button.find({
      amount: { $exists: true },
      amountUsd: { $exists: false }
    });

    console.log(`Found ${buttonsToMigrate.length} buttons to migrate`);

    // Update each button
    for (const button of buttonsToMigrate) {
      await Button.updateOne(
        { _id: button._id },
        { 
          $set: { amountUsd: button.amount },
          $unset: { amount: 1 }
        }
      );
      console.log(`Migrated button: ${button.name} - $${button.amount} -> $${button.amount} USD`);
    }

    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateButtons();
