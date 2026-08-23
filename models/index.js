const { sequelize } = require('../config/database');
const User = require('./User');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Class = require('./Class');
const Section = require('./Section');
const Subject = require('./Subject');
const AcademicYear = require('./AcademicYear');
const Attendance = require('./Attendance');
const Exam = require('./Exam');
const Mark = require('./Mark');
const Fee = require('./Fee');
const Payment = require('./Payment');
const Book = require('./Book');
const LibraryTransaction = require('./LibraryTransaction');
const Announcement = require('./Announcement');
const Notification = require('./Notification');
const Parent = require('./Parent');
const Staff = require('./Staff');
const Timetable = require('./Timetable');
const Assignment = require('./Assignment');

// Define associations
User.hasOne(Student, { foreignKey: 'user_id' });
Student.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(Teacher, { foreignKey: 'user_id' });
Teacher.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(Parent, { foreignKey: 'user_id' });
Parent.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(Staff, { foreignKey: 'user_id' });
Staff.belongsTo(User, { foreignKey: 'user_id' });

Class.hasMany(Section, { foreignKey: 'class_id' });
Section.belongsTo(Class, { foreignKey: 'class_id' });

Class.hasMany(Student, { foreignKey: 'class_id' });
Student.belongsTo(Class, { foreignKey: 'class_id' });

Section.hasMany(Student, { foreignKey: 'section_id' });
Student.belongsTo(Section, { foreignKey: 'section_id' });

Teacher.hasMany(Class, { foreignKey: 'class_teacher_id' });
Class.belongsTo(Teacher, { foreignKey: 'class_teacher_id' });

Teacher.hasMany(Subject, { foreignKey: 'teacher_id' });
Subject.belongsTo(Teacher, { foreignKey: 'teacher_id' });

Class.hasMany(Subject, { foreignKey: 'class_id' });
Subject.belongsTo(Class, { foreignKey: 'class_id' });

Student.hasMany(Attendance, { foreignKey: 'student_id' });
Attendance.belongsTo(Student, { foreignKey: 'student_id' });

Class.hasMany(Attendance, { foreignKey: 'class_id' });
Attendance.belongsTo(Class, { foreignKey: 'class_id' });

Exam.belongsTo(Subject, { foreignKey: 'subject_id' });
Exam.hasMany(Mark, { foreignKey: 'exam_id' });
Mark.belongsTo(Exam, { foreignKey: 'exam_id' });

Student.hasMany(Mark, { foreignKey: 'student_id' });
Mark.belongsTo(Student, { foreignKey: 'student_id' });

Subject.hasMany(Mark, { foreignKey: 'subject_id' });
Mark.belongsTo(Subject, { foreignKey: 'subject_id' });

Student.hasMany(Fee, { foreignKey: 'student_id' });
Fee.belongsTo(Student, { foreignKey: 'student_id' });

Fee.hasMany(Payment, { foreignKey: 'fee_id' });
Payment.belongsTo(Fee, { foreignKey: 'fee_id' });

Student.hasMany(Payment, { foreignKey: 'student_id' });
Payment.belongsTo(Student, { foreignKey: 'student_id' });

Book.hasMany(LibraryTransaction, { foreignKey: 'book_id' });
LibraryTransaction.belongsTo(Book, { foreignKey: 'book_id' });

Student.hasMany(LibraryTransaction, { foreignKey: 'student_id' });
LibraryTransaction.belongsTo(Student, { foreignKey: 'student_id' });

User.hasMany(Announcement, { foreignKey: 'published_by' });
Announcement.belongsTo(User, { foreignKey: 'published_by' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

Parent.hasMany(Student, { foreignKey: 'parent_id' });
Student.belongsTo(Parent, { foreignKey: 'parent_id' });

Class.hasMany(Timetable, { foreignKey: 'class_id' });
Timetable.belongsTo(Class, { foreignKey: 'class_id' });

Subject.hasMany(Timetable, { foreignKey: 'subject_id' });
Timetable.belongsTo(Subject, { foreignKey: 'subject_id' });

Teacher.hasMany(Timetable, { foreignKey: 'teacher_id' });
Timetable.belongsTo(Teacher, { foreignKey: 'teacher_id' });

Subject.hasMany(Assignment, { foreignKey: 'subject_id' });
Assignment.belongsTo(Subject, { foreignKey: 'subject_id' });

Class.hasMany(Assignment, { foreignKey: 'class_id' });
Assignment.belongsTo(Class, { foreignKey: 'class_id' });

Teacher.hasMany(Assignment, { foreignKey: 'teacher_id' });
Assignment.belongsTo(Teacher, { foreignKey: 'teacher_id' });

const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ All models were synchronized successfully.');
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  syncDatabase,
  User,
  Student,
  Teacher,
  Class,
  Section,
  Subject,
  AcademicYear,
  Attendance,
  Exam,
  Mark,
  Fee,
  Payment,
  Book,
  LibraryTransaction,
  Announcement,
  Notification,
  Parent,
  Staff,
  Timetable,
  Assignment
};