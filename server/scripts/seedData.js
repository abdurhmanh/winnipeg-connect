const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Category = require('../models/Category');
const Job = require('../models/Job');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => console.error('MongoDB connection error:', err));

// Winnipeg suburbs for location data
const winnipegSuburbs = [
  'Downtown', 'West End', 'North End', 'East Kildonan', 'West Kildonan',
  'River Heights', 'Tuxedo', 'Fort Rouge', 'Osborne Village', 'Corydon',
  'St. Boniface', 'St. Vital', 'Transcona', 'Charleswood', 'Westwood',
  'Garden City', 'Maples', 'Old Kildonan', 'Seven Oaks', 'Point Douglas'
];

// Categories data
const categoriesData = [
  // Home Repairs
  {
    name: 'Plumbing',
    description: 'Water systems, pipes, fixtures, and drainage repairs',
    icon: 'plumbing',
    order: 1,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },
  {
    name: 'Electrical',
    description: 'Electrical installations, repairs, and safety inspections',
    icon: 'electrical_services',
    order: 2,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },
  {
    name: 'HVAC',
    description: 'Heating, ventilation, and air conditioning services',
    icon: 'hvac',
    order: 3,
    isWinnipegSpecific: true,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },
  {
    name: 'Roofing',
    description: 'Roof repairs, installations, and maintenance',
    icon: 'roofing',
    order: 4,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: false }
  },
  {
    name: 'Flooring',
    description: 'Floor installation, refinishing, and repairs',
    icon: 'flooring',
    order: 5,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },
  {
    name: 'Painting',
    description: 'Interior and exterior painting services',
    icon: 'format_paint',
    order: 6,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: false }
  },
  {
    name: 'Drywall',
    description: 'Drywall installation, repair, and finishing',
    icon: 'construction',
    order: 7,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },

  // Renovations
  {
    name: 'Kitchen Renovation',
    description: 'Complete kitchen remodeling and upgrades',
    icon: 'kitchen',
    order: 8,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },
  {
    name: 'Bathroom Renovation',
    description: 'Bathroom remodeling and fixture installation',
    icon: 'bathtub',
    order: 9,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },
  {
    name: 'Basement Finishing',
    description: 'Basement development and finishing services',
    icon: 'home',
    order: 10,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },

  // Outdoor Services
  {
    name: 'Landscaping',
    description: 'Garden design, planting, and outdoor beautification',
    icon: 'grass',
    order: 11,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: false }
  },
  {
    name: 'Lawn Mowing',
    description: 'Regular lawn maintenance and grass cutting',
    icon: 'content_cut',
    order: 12,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: false }
  },
  {
    name: 'Snow Removal',
    description: 'Winter snow clearing for driveways and walkways',
    icon: 'ac_unit',
    order: 13,
    isWinnipegSpecific: true,
    seasonalAvailability: { spring: false, summer: false, fall: false, winter: true }
  },
  {
    name: 'Tree Services',
    description: 'Tree trimming, removal, and arborist services',
    icon: 'park',
    order: 14,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: false }
  },
  {
    name: 'Fence Installation',
    description: 'Fence building, repair, and maintenance',
    icon: 'fence',
    order: 15,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: false }
  },

  // Cleaning Services
  {
    name: 'House Cleaning',
    description: 'Residential cleaning and maintenance services',
    icon: 'cleaning_services',
    order: 16,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },
  {
    name: 'Carpet Cleaning',
    description: 'Professional carpet and upholstery cleaning',
    icon: 'local_laundry_service',
    order: 17,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },
  {
    name: 'Window Washing',
    description: 'Interior and exterior window cleaning',
    icon: 'window',
    order: 18,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: false }
  },
  {
    name: 'Pressure Washing',
    description: 'High-pressure cleaning for exteriors and surfaces',
    icon: 'water_drop',
    order: 19,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: false }
  },

  // Handyman Services
  {
    name: 'General Handyman',
    description: 'Small repairs, assembly, and general maintenance',
    icon: 'handyman',
    order: 20,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },
  {
    name: 'Furniture Assembly',
    description: 'Assembly of furniture and home fixtures',
    icon: 'chair',
    order: 21,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },
  {
    name: 'Appliance Installation',
    description: 'Installation and setup of home appliances',
    icon: 'kitchen',
    order: 22,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },

  // Specialized Services
  {
    name: 'Pest Control',
    description: 'Pest management and extermination services',
    icon: 'pest_control',
    order: 23,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },
  {
    name: 'Locksmith',
    description: 'Lock installation, repair, and security services',
    icon: 'lock',
    order: 24,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },
  {
    name: 'Security Systems',
    description: 'Home security system installation and monitoring',
    icon: 'security',
    order: 25,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },

  // Moving and Storage
  {
    name: 'Moving Services',
    description: 'Residential and commercial moving assistance',
    icon: 'local_shipping',
    order: 26,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  },
  {
    name: 'Junk Removal',
    description: 'Waste removal and disposal services',
    icon: 'delete',
    order: 27,
    seasonalAvailability: { spring: true, summer: true, fall: true, winter: true }
  }
];

// Sample users data
const usersData = [
  // Service Providers
  {
    email: 'john.plumber@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Smith',
    role: 'provider',
    phone: '204-555-0101',
    bio: 'Licensed plumber with 10+ years experience in Winnipeg. Specializing in residential repairs and installations.',
    categories: ['Plumbing', 'General Handyman'],
    skills: ['Pipe Repair', 'Fixture Installation', 'Drain Cleaning', 'Water Heater Service'],
    rates: { hourly: 85, fixed: { min: 150, max: 2000 } },
    address: {
      street: '123 Main Street',
      city: 'Winnipeg',
      province: 'Manitoba',
      postalCode: 'R3C 1A1',
      suburb: 'Downtown'
    },
    location: {
      type: 'Point',
      coordinates: [-97.1384, 49.8951] // Winnipeg coordinates
    },
    isEmailVerified: true,
    isProfileComplete: true,
    rating: { average: 4.8, count: 24 }
  },
  {
    email: 'sarah.electric@example.com',
    password: 'password123',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'provider',
    phone: '204-555-0102',
    bio: 'Certified electrician serving Winnipeg area. Safe, reliable electrical services for homes and businesses.',
    categories: ['Electrical', 'Security Systems'],
    skills: ['Wiring', 'Panel Upgrades', 'Outlet Installation', 'Lighting', 'Home Automation'],
    rates: { hourly: 95, fixed: { min: 200, max: 5000 } },
    address: {
      street: '456 Portage Avenue',
      city: 'Winnipeg',
      province: 'Manitoba',
      postalCode: 'R3G 0M8',
      suburb: 'West End'
    },
    location: {
      type: 'Point',
      coordinates: [-97.1628, 49.8844]
    },
    isEmailVerified: true,
    isProfileComplete: true,
    rating: { average: 4.9, count: 31 }
  },
  {
    email: 'mike.hvac@example.com',
    password: 'password123',
    firstName: 'Mike',
    lastName: 'Thompson',
    role: 'provider',
    phone: '204-555-0103',
    bio: 'HVAC specialist with expertise in Manitoba\'s extreme weather conditions. Heating and cooling solutions.',
    categories: ['HVAC', 'General Handyman'],
    skills: ['Furnace Repair', 'AC Installation', 'Ductwork', 'Thermostats', 'Energy Efficiency'],
    rates: { hourly: 90, fixed: { min: 300, max: 8000 } },
    address: {
      street: '789 St. Mary\'s Road',
      city: 'Winnipeg',
      province: 'Manitoba',
      postalCode: 'R2M 3L8',
      suburb: 'St. Vital'
    },
    location: {
      type: 'Point',
      coordinates: [-97.1067, 49.8263]
    },
    isEmailVerified: true,
    isProfileComplete: true,
    rating: { average: 4.7, count: 18 }
  },
  {
    email: 'lisa.landscape@example.com',
    password: 'password123',
    firstName: 'Lisa',
    lastName: 'Brown',
    role: 'provider',
    phone: '204-555-0104',
    bio: 'Professional landscaper creating beautiful outdoor spaces in Winnipeg. Garden design and maintenance.',
    categories: ['Landscaping', 'Lawn Mowing', 'Tree Services'],
    skills: ['Garden Design', 'Plant Selection', 'Irrigation', 'Lawn Care', 'Seasonal Cleanup'],
    rates: { hourly: 65, fixed: { min: 500, max: 15000 } },
    address: {
      street: '321 Corydon Avenue',
      city: 'Winnipeg',
      province: 'Manitoba',
      postalCode: 'R3L 0P1',
      suburb: 'River Heights'
    },
    location: {
      type: 'Point',
      coordinates: [-97.1544, 49.8638]
    },
    isEmailVerified: true,
    isProfileComplete: true,
    rating: { average: 4.6, count: 22 }
  },
  {
    email: 'david.snow@example.com',
    password: 'password123',
    firstName: 'David',
    lastName: 'Wilson',
    role: 'provider',
    phone: '204-555-0105',
    bio: 'Reliable snow removal service for Winnipeg winters. Residential and commercial properties.',
    categories: ['Snow Removal', 'General Handyman'],
    skills: ['Snow Plowing', 'Sidewalk Clearing', 'Ice Management', 'Seasonal Contracts'],
    rates: { hourly: 45, fixed: { min: 50, max: 500 } },
    address: {
      street: '654 Henderson Highway',
      city: 'Winnipeg',
      province: 'Manitoba',
      postalCode: 'R2K 2M2',
      suburb: 'East Kildonan'
    },
    location: {
      type: 'Point',
      coordinates: [-97.0817, 49.9178]
    },
    isEmailVerified: true,
    isProfileComplete: true,
    rating: { average: 4.5, count: 67 }
  },

  // Service Seekers
  {
    email: 'homeowner1@example.com',
    password: 'password123',
    firstName: 'Jennifer',
    lastName: 'Davis',
    role: 'seeker',
    phone: '204-555-0201',
    address: {
      street: '147 Wellington Crescent',
      city: 'Winnipeg',
      province: 'Manitoba',
      postalCode: 'R3M 0A1',
      suburb: 'Tuxedo'
    },
    location: {
      type: 'Point',
      coordinates: [-97.1789, 49.8756]
    },
    isEmailVerified: true,
    isProfileComplete: true
  },
  {
    email: 'homeowner2@example.com',
    password: 'password123',
    firstName: 'Robert',
    lastName: 'Miller',
    role: 'seeker',
    phone: '204-555-0202',
    address: {
      street: '258 Elmwood Avenue',
      city: 'Winnipeg',
      province: 'Manitoba',
      postalCode: 'R2L 0M6',
      suburb: 'Elmwood'
    },
    location: {
      type: 'Point',
      coordinates: [-97.0934, 49.9045]
    },
    isEmailVerified: true,
    isProfileComplete: true
  }
];

// Sample jobs data
const jobsData = [
  {
    title: 'Kitchen Sink Leak Repair',
    description: 'My kitchen sink has been leaking under the cabinet for a few days. Need a plumber to fix it quickly before it causes water damage.',
    category: 'Plumbing',
    subcategories: ['Sink Repair', 'Leak Repair'],
    budget: { type: 'range', range: { min: 150, max: 300 } },
    timeline: {
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      estimatedDuration: '2-3 hours'
    },
    location: {
      address: {
        street: '147 Wellington Crescent',
        city: 'Winnipeg',
        province: 'Manitoba',
        postalCode: 'R3M 0A1',
        suburb: 'Tuxedo'
      },
      coordinates: {
        type: 'Point',
        coordinates: [-97.1789, 49.8756]
      }
    },
    priority: 'high',
    requirements: {
      insurance: true,
      license: true
    }
  },
  {
    title: 'Electrical Outlet Installation',
    description: 'Need to install 3 new electrical outlets in my home office. Looking for a licensed electrician.',
    category: 'Electrical',
    subcategories: ['Outlet Installation', 'Wiring'],
    budget: { type: 'fixed', amount: 400 },
    timeline: {
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      estimatedDuration: '4-5 hours'
    },
    location: {
      address: {
        street: '258 Elmwood Avenue',
        city: 'Winnipeg',
        province: 'Manitoba',
        postalCode: 'R2L 0M6',
        suburb: 'Elmwood'
      },
      coordinates: {
        type: 'Point',
        coordinates: [-97.0934, 49.9045]
      }
    },
    priority: 'medium',
    requirements: {
      insurance: true,
      license: true,
      minimumRating: 4.0
    }
  },
  {
    title: 'Winter Snow Removal Contract',
    description: 'Looking for reliable snow removal service for the upcoming winter season. Driveway and walkway clearing needed.',
    category: 'Snow Removal',
    subcategories: ['Driveway Clearing', 'Seasonal Contract'],
    budget: { type: 'range', range: { min: 300, max: 600 } },
    timeline: {
      startDate: new Date('2024-12-01'),
      endDate: new Date('2025-03-31'),
      estimatedDuration: 'Seasonal contract'
    },
    location: {
      address: {
        street: '147 Wellington Crescent',
        city: 'Winnipeg',
        province: 'Manitoba',
        postalCode: 'R3M 0A1',
        suburb: 'Tuxedo'
      },
      coordinates: {
        type: 'Point',
        coordinates: [-97.1789, 49.8756]
      }
    },
    priority: 'low',
    requirements: {
      insurance: true
    }
  },
  {
    title: 'Basement Bathroom Renovation',
    description: 'Complete basement bathroom renovation including plumbing, electrical, tiling, and fixtures. Looking for experienced contractor.',
    category: 'Bathroom Renovation',
    subcategories: ['Full Renovation', 'Plumbing', 'Electrical', 'Tiling'],
    budget: { type: 'range', range: { min: 8000, max: 15000 } },
    timeline: {
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      estimatedDuration: '4-6 weeks'
    },
    location: {
      address: {
        street: '258 Elmwood Avenue',
        city: 'Winnipeg',
        province: 'Manitoba',
        postalCode: 'R2L 0M6',
        suburb: 'Elmwood'
      },
      coordinates: {
        type: 'Point',
        coordinates: [-97.0934, 49.9045]
      }
    },
    priority: 'medium',
    requirements: {
      insurance: true,
      license: true,
      minimumRating: 4.5
    }
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Job.deleteMany({});

    // Seed categories
    console.log('Seeding categories...');
    const categories = await Category.insertMany(categoriesData);
    console.log(`✅ Created ${categories.length} categories`);

    // Hash passwords and seed users
    console.log('Seeding users...');
    const hashedUsers = await Promise.all(
      usersData.map(async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
        return user;
      })
    );
    const users = await User.insertMany(hashedUsers);
    console.log(`✅ Created ${users.length} users`);

    // Seed jobs (assign to seekers)
    console.log('Seeding jobs...');
    const seekers = users.filter(user => user.role === 'seeker');
    const jobsWithOwners = jobsData.map((job, index) => ({
      ...job,
      postedBy: seekers[index % seekers.length]._id
    }));
    const jobs = await Job.insertMany(jobsWithOwners);
    console.log(`✅ Created ${jobs.length} jobs`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Users: ${users.length}`);
    console.log(`   - Providers: ${users.filter(u => u.role === 'provider').length}`);
    console.log(`   - Seekers: ${users.filter(u => u.role === 'seeker').length}`);
    console.log(`   Jobs: ${jobs.length}`);
    
    console.log('\n🔑 Test Login Credentials:');
    console.log('Provider accounts:');
    console.log('  - john.plumber@example.com / password123 (Plumber)');
    console.log('  - sarah.electric@example.com / password123 (Electrician)');
    console.log('  - mike.hvac@example.com / password123 (HVAC)');
    console.log('  - lisa.landscape@example.com / password123 (Landscaper)');
    console.log('  - david.snow@example.com / password123 (Snow Removal)');
    console.log('\nSeeker accounts:');
    console.log('  - homeowner1@example.com / password123');
    console.log('  - homeowner2@example.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding
seedDatabase();
