const mongoose = require('mongoose');
require('dotenv').config();

const Room = require('./models/Room');
const Event = require('./models/Event');
const Resource = require('./models/Resource');
const Faculty = require('./models/Faculty');
const User = require('./models/User');
const Announcement = require('./models/Announcement');
const LostFound = require('./models/LostFound');
const Maintenance = require('./models/Maintenance');
const StudyGroup = require('./models/StudyGroup');
const { DailyMenu, Order, MealPlan } = require('./models/Cafeteria');
const { Route, Vehicle } = require('./models/Transportation');
const Course = require('./models/Course');
const Feedback = require('./models/Feedback');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_navigation')
.then(() => console.log('MongoDB Connected for seeding...'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Sample Rooms Data
const roomsData = [
  {
    roomId: 'A101',
    name: 'Computer Lab 1',
    building: 'A-Block',
    floor: 1,
    coordinates: { x: 100, y: 150 },
    type: 'lab',
    capacity: 40,
    currentOccupancy: 0,
    isAvailable: true,
    facilities: ['Projector', 'Computers', 'Whiteboard', 'WiFi'],
    description: 'Main computer lab with 40 workstations',
    schedule: [
      {
        day: 'Monday',
        timeSlots: [
          { startTime: '09:00', endTime: '11:00', subject: 'Data Structures', faculty: 'Dr. Smith', batch: 'CSE-2024' },
          { startTime: '14:00', endTime: '16:00', subject: 'Web Development', faculty: 'Dr. Johnson', batch: 'CSE-2023' }
        ]
      },
      {
        day: 'Tuesday',
        timeSlots: [
          { startTime: '10:00', endTime: '12:00', subject: 'Database Systems', faculty: 'Dr. Williams', batch: 'CSE-2024' }
        ]
      }
    ]
  },
  {
    roomId: 'A102',
    name: 'Lecture Hall 1',
    building: 'A-Block',
    floor: 1,
    coordinates: { x: 200, y: 150 },
    type: 'classroom',
    capacity: 60,
    currentOccupancy: 0,
    isAvailable: true,
    facilities: ['Projector', 'Sound System', 'Whiteboard', 'WiFi'],
    description: 'Large lecture hall for major classes',
    schedule: [
      {
        day: 'Monday',
        timeSlots: [
          { startTime: '09:00', endTime: '10:30', subject: 'Mathematics', faculty: 'Dr. Brown', batch: 'All' }
        ]
      }
    ]
  },
  {
    roomId: 'A201',
    name: 'Seminar Room',
    building: 'A-Block',
    floor: 2,
    coordinates: { x: 150, y: 200 },
    type: 'seminar',
    capacity: 30,
    currentOccupancy: 0,
    isAvailable: true,
    facilities: ['Projector', 'Video Conferencing', 'Whiteboard', 'WiFi'],
    description: 'Modern seminar room for presentations',
    schedule: []
  },
  {
    roomId: 'B101',
    name: 'Chemistry Lab',
    building: 'B-Block',
    floor: 1,
    coordinates: { x: 300, y: 150 },
    type: 'lab',
    capacity: 25,
    currentOccupancy: 0,
    isAvailable: true,
    facilities: ['Lab Equipment', 'Safety Equipment', 'Ventilation'],
    description: 'Well-equipped chemistry laboratory',
    schedule: [
      {
        day: 'Wednesday',
        timeSlots: [
          { startTime: '09:00', endTime: '12:00', subject: 'Organic Chemistry', faculty: 'Dr. Davis', batch: 'CHE-2024' }
        ]
      }
    ]
  },
  {
    roomId: 'B102',
    name: 'Physics Lab',
    building: 'B-Block',
    floor: 1,
    coordinates: { x: 350, y: 150 },
    type: 'lab',
    capacity: 30,
    currentOccupancy: 0,
    isAvailable: true,
    facilities: ['Physics Equipment', 'Measurement Tools', 'Whiteboard'],
    description: 'Physics laboratory with modern equipment',
    schedule: []
  },
  {
    roomId: 'C101',
    name: 'Library Reading Room',
    building: 'C-Block',
    floor: 1,
    coordinates: { x: 400, y: 200 },
    type: 'library',
    capacity: 100,
    currentOccupancy: 15,
    isAvailable: true,
    facilities: ['Study Desks', 'WiFi', 'Quiet Zone', 'Reference Books'],
    description: 'Quiet reading room in the library',
    schedule: []
  },
  {
    roomId: 'A301',
    name: 'Auditorium',
    building: 'A-Block',
    floor: 3,
    coordinates: { x: 250, y: 300 },
    type: 'auditorium',
    capacity: 200,
    currentOccupancy: 0,
    isAvailable: true,
    facilities: ['Stage', 'Sound System', 'Projector', 'Lighting', 'WiFi'],
    description: 'Main auditorium for large events',
    schedule: []
  },
  {
    roomId: 'A103',
    name: 'Faculty Office 1',
    building: 'A-Block',
    floor: 1,
    coordinates: { x: 100, y: 100 },
    type: 'office',
    capacity: 5,
    currentOccupancy: 2,
    isAvailable: true,
    facilities: ['Desks', 'WiFi', 'Printer'],
    description: 'Shared faculty office space',
    schedule: []
  }
];

// Sample Events Data
const eventsData = [
  {
    title: 'Tech Fest 2024',
    description: 'Annual technology festival with coding competitions, workshops, and tech talks',
    venue: {
      roomId: 'A301',
      building: 'A-Block',
      floor: 3,
      coordinates: { x: 250, y: 300 }
    },
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    startTime: '09:00',
    endTime: '18:00',
    organizer: 'Computer Science Department',
    category: 'fest',
    maxAttendees: 200,
    status: 'upcoming'
  },
  {
    title: 'Web Development Workshop',
    description: 'Hands-on workshop on modern web development with React and Node.js',
    venue: {
      roomId: 'A101',
      building: 'A-Block',
      floor: 1,
      coordinates: { x: 100, y: 150 }
    },
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    startTime: '14:00',
    endTime: '17:00',
    organizer: 'Dr. Johnson',
    category: 'workshop',
    maxAttendees: 40,
    status: 'upcoming'
  },
  {
    title: 'Career Guidance Seminar',
    description: 'Seminar on career opportunities in IT industry',
    venue: {
      roomId: 'A201',
      building: 'A-Block',
      floor: 2,
      coordinates: { x: 150, y: 200 }
    },
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    startTime: '10:00',
    endTime: '12:00',
    organizer: 'Placement Cell',
    category: 'seminar',
    maxAttendees: 30,
    status: 'upcoming'
  },
  {
    title: 'Mid-Term Examinations',
    description: 'Mid-term exams for all courses',
    venue: {
      roomId: 'A102',
      building: 'A-Block',
      floor: 1,
      coordinates: { x: 200, y: 150 }
    },
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    startTime: '09:00',
    endTime: '12:00',
    organizer: 'Examination Department',
    category: 'exam',
    maxAttendees: 60,
    status: 'upcoming'
  }
];

// Sample Resources Data
const resourcesData = [
  {
    name: 'Library Seat 1',
    type: 'library-seat',
    location: {
      roomId: 'C101',
      building: 'C-Block',
      floor: 1,
      coordinates: { x: 400, y: 200 }
    },
    status: 'available',
    metadata: { seatNumber: 'L-001' }
  },
  {
    name: 'Library Seat 2',
    type: 'library-seat',
    location: {
      roomId: 'C101',
      building: 'C-Block',
      floor: 1,
      coordinates: { x: 410, y: 200 }
    },
    status: 'occupied',
    metadata: { seatNumber: 'L-002' }
  },
  {
    name: 'Computer Workstation 1',
    type: 'computer',
    location: {
      roomId: 'A101',
      building: 'A-Block',
      floor: 1,
      coordinates: { x: 100, y: 150 }
    },
    status: 'available',
    metadata: { computerId: 'PC-001' }
  },
  {
    name: 'Computer Workstation 2',
    type: 'computer',
    location: {
      roomId: 'A101',
      building: 'A-Block',
      floor: 1,
      coordinates: { x: 110, y: 150 }
    },
    status: 'available',
    metadata: { computerId: 'PC-002' }
  },
  {
    name: 'Study Room 1',
    type: 'study-room',
    location: {
      roomId: 'C101',
      building: 'C-Block',
      floor: 1,
      coordinates: { x: 420, y: 200 }
    },
    status: 'available',
    metadata: { seatNumber: 'SR-001' }
  },
  {
    name: 'Lab Equipment - Microscope',
    type: 'lab-equipment',
    location: {
      roomId: 'B101',
      building: 'B-Block',
      floor: 1,
      coordinates: { x: 300, y: 150 }
    },
    status: 'available',
    metadata: { equipmentName: 'Digital Microscope' }
  }
];

// Seed function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await Room.deleteMany({});
    await Event.deleteMany({});
    await Resource.deleteMany({});
    await Faculty.deleteMany({});
    await Announcement.deleteMany({});
    await LostFound.deleteMany({});
    await StudyGroup.deleteMany({});
    await DailyMenu.deleteMany({});
    await Route.deleteMany({});
    await Course.deleteMany({});
    await Feedback.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create default admin user if no users exist
    let defaultUser = await User.findOne({ email: 'admin@campus.edu' });
    if (!defaultUser) {
      console.log('👤 Creating default admin user...');
      defaultUser = await User.create({
        name: 'Campus Admin',
        email: 'admin@campus.edu',
        password: 'admin123456',
        role: 'admin',
        department: 'Administration'
      });
      console.log('✅ Default admin created (admin@campus.edu / admin123456)\n');
    }

    // Seed Rooms
    console.log('📦 Seeding Rooms...');
    const rooms = await Room.insertMany(roomsData);
    console.log(`✅ Created ${rooms.length} rooms\n`);

    // Seed Events
    console.log('📅 Seeding Events...');
    const events = await Event.insertMany(eventsData);
    console.log(`✅ Created ${events.length} events\n`);

    // Seed Resources
    console.log('🖥️  Seeding Resources...');
    const resources = await Resource.insertMany(resourcesData);
    console.log(`✅ Created ${resources.length} resources\n`);

    // Seed Faculty (if users exist)
    console.log('👨‍🏫 Seeding Faculty...');
    const users = await User.find({ role: 'faculty' }).limit(3);
    if (users.length > 0) {
      const facultyData = users.map((user, index) => ({
        userId: user._id,
        name: user.name,
        department: user.department || 'Computer Science',
        designation: index === 0 ? 'Professor' : index === 1 ? 'Associate Professor' : 'Assistant Professor',
        cabin: {
          roomId: `A10${3 + index}`,
          building: 'A-Block',
          floor: 1,
          coordinates: { x: 100 + (index * 50), y: 100 }
        },
        availability: {
          schedule: [
            {
              day: 'Monday',
              timeSlots: [
                { startTime: '10:00', endTime: '12:00' },
                { startTime: '14:00', endTime: '16:00' }
              ]
            },
            {
              day: 'Wednesday',
              timeSlots: [
                { startTime: '10:00', endTime: '12:00' }
              ]
            }
          ],
          isAvailable: true,
          currentStatus: 'available'
        },
        contact: {
          email: user.email,
          phone: `+91-98765${43210 + index}`,
          extension: `EXT-${100 + index}`
        }
      }));

      const faculty = await Faculty.insertMany(facultyData);
      console.log(`✅ Created ${faculty.length} faculty profiles\n`);
    } else {
      console.log('⚠️  No faculty users found. Skipping faculty seeding.\n');
      console.log('💡 Tip: Create faculty accounts first, then run this script again.\n');
    }

    // Seed Announcements
    console.log('📢 Seeding Announcements...');
    const announcementsData = [
      {
        title: 'Welcome Back to Campus!',
        content: 'We are excited to welcome all students back for the new semester. Please check your schedules and familiarize yourself with the new facilities.',
        scope: 'campus-wide',
        priority: 'high',
        isActive: true
      },
      {
        title: 'Library Extended Hours',
        content: 'The library will now be open until 10 PM on weekdays. Study rooms can be booked through the app.',
        scope: 'campus-wide',
        priority: 'normal',
        isActive: true
      },
      {
        title: 'Computer Science Department Meeting',
        content: 'All CS students are required to attend the department meeting on Friday at 2 PM in Auditorium A301.',
        scope: 'department',
        targetDepartment: 'Computer Science',
        priority: 'high',
        isActive: true
      }
    ];
    const announcements = await Announcement.insertMany(announcementsData.map(a => ({
      ...a,
      author: defaultUser._id
    })));
    console.log(`✅ Created ${announcements.length} announcements\n`);

    // Seed Lost & Found
    console.log('🔍 Seeding Lost & Found...');
    const lostFoundData = [
      {
        type: 'lost',
        title: 'Lost Laptop Charger',
        description: 'Black Dell laptop charger, lost near A-Block',
        category: 'electronics',
        location: { building: 'A-Block', description: 'Near main entrance' },
        status: 'open'
      },
      {
        type: 'found',
        title: 'Found Student ID Card',
        description: 'Found a student ID card in the cafeteria',
        category: 'documents',
        location: { building: 'C-Block', description: 'Cafeteria area' },
        status: 'open'
      }
    ];
    const lostFound = await LostFound.insertMany(lostFoundData.map(item => ({
      ...item,
      reportedBy: defaultUser._id
    })));
    console.log(`✅ Created ${lostFound.length} lost & found items\n`);

    // Seed Study Groups
    console.log('📚 Seeding Study Groups...');
    const studyGroupsData = [
      {
        name: 'Data Structures Study Group',
        description: 'Study group for Data Structures and Algorithms course',
        subject: 'Data Structures',
        courseCode: 'CS201',
        maxMembers: 10,
        isPublic: true
      },
      {
        name: 'Web Development Team',
        description: 'Collaborative group for web development projects',
        subject: 'Web Development',
        maxMembers: 8,
        isPublic: true
      }
    ];
    const studyGroups = await StudyGroup.insertMany(studyGroupsData.map(group => ({
      ...group,
      createdBy: defaultUser._id,
      members: [{ userId: defaultUser._id, role: 'admin' }]
    })));
    console.log(`✅ Created ${studyGroups.length} study groups\n`);

    // Seed Cafeteria Menu
    console.log('🍽️  Seeding Cafeteria Menu...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const menuItems = [
      { name: 'Breakfast Combo', description: 'Eggs, toast, and coffee', category: 'breakfast', price: 5.99 },
      { name: 'Chicken Curry', description: 'Spicy chicken curry with rice', category: 'lunch', price: 8.99 },
      { name: 'Vegetable Pasta', description: 'Fresh pasta with vegetables', category: 'dinner', price: 7.99 },
      { name: 'Fresh Salad', description: 'Mixed greens with dressing', category: 'lunch', price: 4.99 }
    ];
    const dailyMenu = new DailyMenu({
      date: today,
      items: menuItems,
      specials: [{ name: 'Chef Special Pizza', description: 'Today\'s special', category: 'lunch', price: 9.99 }]
    });
    await dailyMenu.save();
    console.log('✅ Created daily menu\n');

    // Seed Transportation Routes
    console.log('🚌 Seeding Transportation...');
    const routesData = [
      {
        routeNumber: 'R1',
        name: 'Main Campus Loop',
        description: 'Circular route covering all main buildings',
        stops: [
          { name: 'Main Gate', coordinates: { lat: 28.7041, lng: 77.1025 }, order: 1 },
          { name: 'A-Block', coordinates: { lat: 28.7045, lng: 77.1030 }, order: 2 },
          { name: 'B-Block', coordinates: { lat: 28.7048, lng: 77.1035 }, order: 3 },
          { name: 'C-Block', coordinates: { lat: 28.7050, lng: 77.1040 }, order: 4 }
        ],
        schedule: [
          { day: 'All', times: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'] }
        ],
        isActive: true
      }
    ];
    const transportRoutes = await Route.insertMany(routesData);
    console.log(`✅ Created ${transportRoutes.length} routes\n`);

    // Seed Courses
    console.log('📖 Seeding Courses...');
    const coursesData = [
      {
        courseCode: 'CS201',
        name: 'Data Structures and Algorithms',
        description: 'Introduction to data structures and algorithm analysis',
        department: 'Computer Science',
        credits: 3,
        semester: 'Fall',
        year: 2024,
        maxEnrollment: 60
      },
      {
        courseCode: 'CS301',
        name: 'Web Development',
        description: 'Modern web development with React and Node.js',
        department: 'Computer Science',
        credits: 4,
        semester: 'Fall',
        year: 2024,
        maxEnrollment: 40
      }
    ];
    const courses = await Course.insertMany(coursesData);
    console.log(`✅ Created ${courses.length} courses\n`);

    // Seed Feedback
    console.log('💬 Seeding Feedback...');
    const feedbackData = [
      {
        type: 'room',
        rating: 5,
        title: 'Great Lab Facilities',
        comment: 'The computer lab has excellent equipment and is always well-maintained.',
        isPublic: true,
        status: 'approved'
      },
      {
        type: 'facility',
        rating: 4,
        title: 'Cafeteria Food Quality',
        comment: 'Good variety but could use more vegetarian options.',
        isPublic: true,
        status: 'approved'
      }
    ];
    const feedbacks = await Feedback.insertMany(feedbackData.map(f => ({
      ...f,
      userId: defaultUser._id
    })));
    console.log(`✅ Created ${feedbacks.length} feedback entries\n`);

    console.log('✨ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Rooms: ${rooms.length}`);
    console.log(`   - Events: ${events.length}`);
    console.log(`   - Resources: ${resources.length}`);
    console.log(`   - Faculty: ${users.length > 0 ? users.length : 0}`);
    console.log(`   - Announcements: ${announcements.length}`);
    console.log(`   - Lost & Found: ${lostFound.length}`);
    console.log(`   - Study Groups: ${studyGroups.length}`);
    console.log(`   - Transportation Routes: ${transportRoutes.length}`);
    console.log(`   - Courses: ${courses.length}`);
    console.log(`   - Feedback: ${feedbacks.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run seed
seedDatabase();

