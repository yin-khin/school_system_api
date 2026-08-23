const { sequelize } = require('./database');
const { User, Student, Teacher, Class, Section, Subject, AcademicYear, Book } = require('../models');

const seedDatabase = async () => {
  try {
    // Create admin user (login with email: admin@school.com / password: admin123)
    const adminExists = await User.findOne({ where: { email: 'admin@school.com' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@school.com',
        password: 'admin123',
        role: 'admin',
        full_name: 'School Administrator',
        status: 'active'
      });
      console.log('✅ Admin user created (email: admin@school.com, password: admin123)');
    }

    // Create test user (login with email: test@school.com / password: test123)
    const testExists = await User.findOne({ where: { email: 'test@school.com' } });
    if (!testExists) {
      await User.create({
        username: 'test',
        email: 'test@school.com',
        password: 'test123',
        role: 'admin',
        full_name: 'Test User',
        status: 'active'
      });
      console.log('✅ Test user created (email: test@school.com, password: test123)');
    }

    // Create academic years
    const [year2025, year2026] = await Promise.all([
      AcademicYear.findOrCreate({
        where: { name: '2025-2026' },
        defaults: { start_date: '2025-09-01', end_date: '2026-08-31', is_current: false }
      }),
      AcademicYear.findOrCreate({
        where: { name: '2026-2027' },
        defaults: { start_date: '2026-09-01', end_date: '2027-08-31', is_current: true }
      })
    ]);

    // Create subjects
    const subjects = [
      { name: 'Mathematics', code: 'MATH', description: 'Mathematics course', credit: 1 },
      { name: 'Physics', code: 'PHY', description: 'Physics course', credit: 1 },
      { name: 'Chemistry', code: 'CHEM', description: 'Chemistry course', credit: 1 },
      { name: 'Biology', code: 'BIO', description: 'Biology course', credit: 1 },
      { name: 'English', code: 'ENG', description: 'English language', credit: 1 },
      { name: 'Khmer', code: 'KHM', description: 'Khmer literature', credit: 1 },
      { name: 'History', code: 'HIST', description: 'History course', credit: 1 },
      { name: 'Geography', code: 'GEO', description: 'Geography course', credit: 1 },
      { name: 'Computer Science', code: 'CS', description: 'Computer science basics', credit: 1 },
      { name: 'Physical Education', code: 'PE', description: 'Sports and health', credit: 0.5 }
    ];

    for (const subject of subjects) {
      await Subject.findOrCreate({
        where: { code: subject.code },
        defaults: subject
      });
    }
    console.log('✅ Subjects created');

    // Create classes
    const classes = [
      { name: 'Grade 1', code: 'G1' },
      { name: 'Grade 2', code: 'G2' },
      { name: 'Grade 3', code: 'G3' },
      { name: 'Grade 4', code: 'G4' },
      { name: 'Grade 5', code: 'G5' },
      { name: 'Grade 6', code: 'G6' },
      { name: 'Grade 7', code: 'G7' },
      { name: 'Grade 8', code: 'G8' },
      { name: 'Grade 9', code: 'G9' },
      { name: 'Grade 10', code: 'G10' },
      { name: 'Grade 11', code: 'G11' },
      { name: 'Grade 12', code: 'G12' }
    ];

    for (const classData of classes) {
      const [createdClass, created] = await Class.findOrCreate({
        where: { code: classData.code },
        defaults: {
          ...classData,
          academic_year_id: year2026[0].id,
          capacity: 40
        }
      });
      console.log(created ? `✅ Class ${classData.name} created` : `Class ${classData.name} exists`);
    }

    // Create sample books
    const sampleBooks = [
      { isbn: '9783161484100', title: 'Mathematics for Grade 10', author: 'John Smith', category: 'Textbook', quantity: 10 },
      { isbn: '9780131103627', title: 'Physics Fundamentals', author: 'Jane Doe', category: 'Science', quantity: 8 },
      { isbn: '9780201616224', title: 'English Grammar', author: 'Robert Brown', category: 'Language', quantity: 15 },
      { isbn: '9780618260300', title: 'History of Southeast Asia', author: 'David Wilson', category: 'History', quantity: 12 }
    ];

    for (const book of sampleBooks) {
      const bookExists = await Book.findOne({ where: { isbn: book.isbn } });
      if (!bookExists) {
        // Find the next available book_id
        let bookNumber = 1;
        let bookId = '';
        let found = false;
        while (!found) {
          bookId = `BK-${String(bookNumber).padStart(4, '0')}`;
          const existing = await Book.findOne({ where: { book_id: bookId } });
          if (!existing) {
            found = true;
          } else {
            bookNumber++;
          }
        }
        await Book.create({
          book_id: bookId,
          ...book,
          available: book.quantity
        });
      }
    }
    console.log('✅ Sample books created');

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }
};

module.exports = { seedDatabase };