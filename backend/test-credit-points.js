const mongoose = require('mongoose');
const Idea = require('./src/models/Idea');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect("mongodb+srv://vithack28:vithack28@cluster0.cq6gr.mongodb.net/Sakthi_Spark?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function testCreditPointsCalculation() {
  try {
    console.log('Testing credit points calculation...');
    
    // Get a test user
    const user = await User.findOne({ employeeNumber: '12345' });
    if (!user) {
      console.log('Test user not found. Creating one...');
      return;
    }
    
    console.log('User found:', user.name, 'Current credit points:', user.creditPoints);
    
    // Get user's ideas
    const ideas = await Idea.find({ submittedBy: user._id, isActive: { $ne: false } });
    console.log('User ideas count:', ideas.length);
    
    // Calculate expected points
    let submitted = ideas.length;
    let approved = ideas.filter(i => i.status === 'approved').length;
    let implemented = ideas.filter(i => i.status === 'implemented').length;
    const expectedPoints = (submitted * 10) + (approved * 20) + (implemented * 30);
    
    console.log('Points breakdown:', {
      submitted,
      approved,
      implemented,
      expectedPoints,
      currentPoints: user.creditPoints
    });
    
    // Update user's credit points
    await User.findByIdAndUpdate(user._id, { creditPoints: expectedPoints });
    console.log('Credit points updated to:', expectedPoints);
    
    // Verify the update
    const updatedUser = await User.findById(user._id);
    console.log('Updated user credit points:', updatedUser.creditPoints);
    
  } catch (error) {
    console.error('Error testing credit points:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testCreditPointsCalculation(); 