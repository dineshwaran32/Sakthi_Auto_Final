const mongoose = require('mongoose');
const User = require('../src/models/User');
const Idea = require('../src/models/Idea');
const Notification = require('../src/models/Notification');

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://vithack28:vithack28@cluster0.cq6gr.mongodb.net/Sakthi_Spark?retryWrites=true&w=majority&appName=Cluster0");
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  const users = [
    {
      employeeNumber: '12345',
      name: 'John Doe',
      email: 'john.doe@company.com',
      department: 'Engineering',
      designation: 'Senior Engineer',
      role: 'employee',
      mobileNumber: '9876543210'
    },
    {
      employeeNumber: '67890',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      department: 'Quality',
      designation: 'Quality Manager',
      role: 'reviewer',
      mobileNumber: '9123456780'
    },
    {
      employeeNumber: '22222',
      name: 'Alice Johnson',
      email: 'alice.johnson@company.com',
      department: 'Manufacturing',
      designation: 'Production Supervisor',
      role: 'employee',
      mobileNumber: '9988776655'
    },
    {
      employeeNumber: '33333',
      name: 'Bob Wilson',
      email: 'bob.wilson@company.com',
      department: 'Engineering',
      designation: 'Design Engineer',
      role: 'employee',
      mobileNumber: '9001122334'
    },
    {
      employeeNumber: '44444',
      name: 'Carol Brown',
      email: 'carol.brown@company.com',
      department: 'Quality',
      designation: 'Quality Inspector',
      role: 'employee',
      mobileNumber: '9112233445'
    }
  ];

  await User.deleteMany({});
  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
};

const seedIdeas = async (users) => {
  const ideas = [
    {
      title: 'Improve Assembly Line Efficiency',
      problem: 'Current assembly line has bottlenecks causing delays and reducing overall productivity',
      improvement: 'Reorganize workstations and implement lean principles to eliminate waste and improve flow',
      benefit: 'productivity',
      estimatedSavings: 50000,
      department: 'Manufacturing',
      submittedBy: users.find(u => u.employeeNumber === '22222')._id,
      submittedByEmployeeNumber: '22222',
      status: 'approved',
      reviewedBy: users.find(u => u.employeeNumber === '67890')._id,
      reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      reviewComments: 'Excellent proposal with clear implementation plan'
    },
    {
      title: 'Digital Document Management System',
      problem: 'Paper-based filing system is inefficient and prone to errors',
      improvement: 'Implement digital document management system with cloud storage and search capabilities',
      benefit: 'cost_saving',
      estimatedSavings: 25000,
      department: 'Administration',
      submittedBy: users.find(u => u.employeeNumber === '12345')._id,
      submittedByEmployeeNumber: '12345',
      status: 'under_review'
    },
    {
      title: 'Safety Equipment Upgrade',
      problem: 'Current safety equipment is outdated and not meeting new safety standards',
      improvement: 'Upgrade to modern safety equipment with better protection and comfort',
      benefit: 'safety',
      estimatedSavings: 15000,
      department: 'Manufacturing',
      submittedBy: users.find(u => u.employeeNumber === '33333')._id,
      submittedByEmployeeNumber: '33333',
      status: 'implementing',
      reviewedBy: users.find(u => u.employeeNumber === '67890')._id,
      reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      reviewComments: 'Approved for implementation. Safety is our priority.'
    },
    {
      title: 'Quality Control Automation',
      problem: 'Manual quality checks are time-consuming and inconsistent',
      improvement: 'Implement automated quality control systems with real-time monitoring',
      benefit: 'quality',
      estimatedSavings: 75000,
      department: 'Quality',
      submittedBy: users.find(u => u.employeeNumber === '44444')._id,
      submittedByEmployeeNumber: '44444',
      status: 'approved',
      reviewedBy: users.find(u => u.employeeNumber === '67890')._id,
      reviewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      reviewComments: 'Great idea! This will significantly improve our quality metrics.'
    },
    {
      title: 'Energy Efficient Lighting',
      problem: 'Current lighting system consumes too much energy and increases operational costs',
      improvement: 'Replace with LED lighting system with motion sensors and smart controls',
      benefit: 'cost_saving',
      estimatedSavings: 30000,
      department: 'Engineering',
      submittedBy: users.find(u => u.employeeNumber === '33333')._id,
      submittedByEmployeeNumber: '33333',
      status: 'implemented',
      reviewedBy: users.find(u => u.employeeNumber === '67890')._id,
      reviewedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      implementationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      actualSavings: 32000,
      reviewComments: 'Successfully implemented with even better results than expected!'
    }
  ];

  await Idea.deleteMany({});
  const createdIdeas = await Idea.insertMany(ideas);
  console.log(`✅ Created ${createdIdeas.length} ideas`);
  return createdIdeas;
};

const seedNotifications = async (users, ideas) => {
  const notifications = [
    {
      recipient: users.find(u => u.employeeNumber === '22222')._id,
      recipientEmployeeNumber: '22222',
      type: 'idea_approved',
      title: 'Idea Approved',
      message: 'Your idea "Improve Assembly Line Efficiency" has been approved',
      relatedIdea: ideas.find(i => i.title === 'Improve Assembly Line Efficiency')._id,
      isRead: false
    },
    {
      recipient: users.find(u => u.employeeNumber === '33333')._id,
      recipientEmployeeNumber: '33333',
      type: 'idea_implementing',
      title: 'Idea Implementation Started',
      message: 'Your idea "Safety Equipment Upgrade" is now being implemented',
      relatedIdea: ideas.find(i => i.title === 'Safety Equipment Upgrade')._id,
      isRead: true,
      readAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      recipient: users.find(u => u.employeeNumber === '33333')._id,
      recipientEmployeeNumber: '33333',
      type: 'idea_implemented',
      title: 'Idea Successfully Implemented',
      message: 'Your idea "Energy Efficient Lighting" has been successfully implemented',
      relatedIdea: ideas.find(i => i.title === 'Energy Efficient Lighting')._id,
      isRead: false
    }
  ];

  await Notification.deleteMany({});
  const createdNotifications = await Notification.insertMany(notifications);
  console.log(`✅ Created ${createdNotifications.length} notifications`);
};

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...');
    
    const users = await seedUsers();
    const ideas = await seedIdeas(users);
    await seedNotifications(users, ideas);
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Employee: 12345 | OTP: 1234');
    console.log('Reviewer: 67890 | OTP: 1234');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding or recalculate if this file is executed directly
if (require.main === module) {
  const arg = process.argv[2];
  if (arg === 'recalculate') {
    recalculateAllUserCreditPoints();
  } else {
    seedDatabase();
  }
}

module.exports = { seedDatabase };

async function recalculateAllUserCreditPoints() {
  await mongoose.connect("mongodb+srv://vithack28:vithack28@cluster0.cq6gr.mongodb.net/Sakthi_Spark?retryWrites=true&w=majority&appName=Cluster0"); 
  const users = await User.find({});
  for (const user of users) {
    const ideas = await Idea.find({ submittedBy: user._id, isActive: { $ne: false } });
    let submitted = ideas.length;
    let approved = ideas.filter(i => i.status === 'approved').length;
    let implemented = ideas.filter(i => i.status === 'implemented').length;
    const creditPoints = (submitted * 10) + (approved * 20) + (implemented * 30);
    user.creditPoints = creditPoints;
    await user.save();
    console.log(`Updated ${user.name} (${user.employeeNumber}): ${creditPoints} points`);
  }
  await mongoose.disconnect();
  console.log('All user credit points recalculated.');
}