const { 
  User, Student, Teacher, Parent, Class, Section, Subject, AcademicYear,
  Attendance, Exam, Mark, Fee, Payment, Book, LibraryTransaction,
  Announcement, Notification, Staff, Timetable, Assignment
} = require('../models');
const { sequelize } = require('../config/database');

// @desc    Export all data to JSON
// @route   GET /api/backup/export
// @access  Private
const exportData = async (req, res) => {
  try {
    console.log('📦 Starting data export...');

    // Fetch all data from all tables
    const [users, students, teachers, parents, classes, sections, subjects, 
      academicYears, attendance, exams, marks, fees, payments, books, 
      libraryTransactions, announcements, notifications, staffs, timetables, assignments] = await Promise.all([
      User.findAll(),
      Student.findAll(),
      Teacher.findAll(),
      Parent.findAll(),
      Class.findAll(),
      Section.findAll(),
      Subject.findAll(),
      AcademicYear.findAll(),
      Attendance.findAll(),
      Exam.findAll(),
      Mark.findAll(),
      Fee.findAll(),
      Payment.findAll(),
      Book.findAll(),
      LibraryTransaction.findAll(),
      Announcement.findAll(),
      Notification.findAll(),
      Staff.findAll(),
      Timetable.findAll(),
      Assignment.findAll()
    ]);

    // Build backup data
    const backupData = {
      meta: {
        app: 'School Management System',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        database: process.env.DB_NAME || 'school_management'
      },
      counts: {
        users: users.length,
        students: students.length,
        teachers: teachers.length,
        parents: parents.length,
        classes: classes.length,
        sections: sections.length,
        subjects: subjects.length,
        academicYears: academicYears.length,
        attendance: attendance.length,
        exams: exams.length,
        marks: marks.length,
        fees: fees.length,
        payments: payments.length,
        books: books.length,
        libraryTransactions: libraryTransactions.length,
        announcements: announcements.length,
        notifications: notifications.length,
        staffs: staffs.length,
        timetables: timetables.length,
        assignments: assignments.length,
        total: users.length + students.length + teachers.length + parents.length + 
               classes.length + sections.length + subjects.length + academicYears.length +
               attendance.length + exams.length + marks.length + fees.length +
               payments.length + books.length + libraryTransactions.length +
               announcements.length + notifications.length + staffs.length +
               timetables.length + assignments.length
      },
      data: {
        users,
        students,
        teachers,
        parents,
        classes,
        sections,
        subjects,
        academicYears,
        attendance,
        exams,
        marks,
        fees,
        payments,
        books,
        libraryTransactions,
        announcements,
        notifications,
        staffs,
        timetables,
        assignments
      }
    };

    console.log(`✅ Export complete: ${backupData.counts.total} total records`);

    res.json({
      success: true,
      message: `Backup created successfully with ${backupData.counts.total} records`,
      data: backupData
    });
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
};

// @desc    Import data from JSON backup
// @route   POST /api/backup/import
// @access  Private
const importData = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ message: 'No backup data provided' });
    }

    console.log('📦 Starting data import...');

    const results = {
      users: 0, students: 0, teachers: 0, parents: 0, classes: 0,
      sections: 0, subjects: 0, academicYears: 0, attendance: 0,
      exams: 0, marks: 0, fees: 0, payments: 0, books: 0,
      libraryTransactions: 0, announcements: 0, notifications: 0,
      staffs: 0, timetables: 0, assignments: 0
    };

    // Import users
    if (data.users?.length) {
      for (const item of data.users) {
        const { id, ...rest } = item;
        // Check if user exists by email
        const existing = await User.findOne({ where: { email: item.email } });
        if (!existing) {
          await User.create({ ...rest, id: undefined }, { transaction });
          results.users++;
        }
      }
    }

    // Import academic years
    if (data.academicYears?.length) {
      for (const item of data.academicYears) {
        const existing = await AcademicYear.findOne({ where: { name: item.name } });
        if (!existing) {
          await AcademicYear.create({ ...item, id: undefined }, { transaction });
          results.academicYears++;
        }
      }
    }

    // Import classes
    if (data.classes?.length) {
      for (const item of data.classes) {
        const existing = await Class.findOne({ where: { code: item.code } });
        if (!existing) {
          await Class.create({ ...item, id: undefined }, { transaction });
          results.classes++;
        }
      }
    }

    // Import sections
    if (data.sections?.length) {
      for (const item of data.sections) {
        await Section.create({ ...item, id: undefined }, { transaction });
        results.sections++;
      }
    }

    // Import subjects
    if (data.subjects?.length) {
      for (const item of data.subjects) {
        const existing = await Subject.findOne({ where: { code: item.code } });
        if (!existing) {
          await Subject.create({ ...item, id: undefined }, { transaction });
          results.subjects++;
        }
      }
    }

    // Import students
    if (data.students?.length) {
      for (const item of data.students) {
        const existing = await Student.findOne({ where: { student_id: item.student_id } });
        if (!existing) {
          await Student.create({ ...item, id: undefined }, { transaction });
          results.students++;
        }
      }
    }

    // Import teachers
    if (data.teachers?.length) {
      for (const item of data.teachers) {
        const existing = await Teacher.findOne({ where: { teacher_id: item.teacher_id } });
        if (!existing) {
          await Teacher.create({ ...item, id: undefined }, { transaction });
          results.teachers++;
        }
      }
    }

    // Import parents
    if (data.parents?.length) {
      for (const item of data.parents) {
        await Parent.create({ ...item, id: undefined }, { transaction });
        results.parents++;
      }
    }

    // Import staff
    if (data.staffs?.length) {
      for (const item of data.staffs) {
        const existing = await Staff.findOne({ where: { staff_id: item.staff_id } });
        if (!existing) {
          await Staff.create({ ...item, id: undefined }, { transaction });
          results.staffs++;
        }
      }
    }

    // Import attendance
    if (data.attendance?.length) {
      for (const item of data.attendance) {
        await Attendance.create({ ...item, id: undefined }, { transaction });
        results.attendance++;
      }
    }

    // Import exams
    if (data.exams?.length) {
      for (const item of data.exams) {
        await Exam.create({ ...item, id: undefined }, { transaction });
        results.exams++;
      }
    }

    // Import marks
    if (data.marks?.length) {
      for (const item of data.marks) {
        await Mark.create({ ...item, id: undefined }, { transaction });
        results.marks++;
      }
    }

    // Import fees
    if (data.fees?.length) {
      for (const item of data.fees) {
        await Fee.create({ ...item, id: undefined }, { transaction });
        results.fees++;
      }
    }

    // Import payments
    if (data.payments?.length) {
      for (const item of data.payments) {
        await Payment.create({ ...item, id: undefined }, { transaction });
        results.payments++;
      }
    }

    // Import books
    if (data.books?.length) {
      for (const item of data.books) {
        const existing = await Book.findOne({ where: { book_id: item.book_id } });
        if (!existing) {
          await Book.create({ ...item, id: undefined }, { transaction });
          results.books++;
        }
      }
    }

    // Import library transactions
    if (data.libraryTransactions?.length) {
      for (const item of data.libraryTransactions) {
        await LibraryTransaction.create({ ...item, id: undefined }, { transaction });
        results.libraryTransactions++;
      }
    }

    // Import announcements
    if (data.announcements?.length) {
      for (const item of data.announcements) {
        await Announcement.create({ ...item, id: undefined }, { transaction });
        results.announcements++;
      }
    }

    // Import notifications
    if (data.notifications?.length) {
      for (const item of data.notifications) {
        await Notification.create({ ...item, id: undefined }, { transaction });
        results.notifications++;
      }
    }

    // Import timetables
    if (data.timetables?.length) {
      for (const item of data.timetables) {
        await Timetable.create({ ...item, id: undefined }, { transaction });
        results.timetables++;
      }
    }

    // Import assignments
    if (data.assignments?.length) {
      for (const item of data.assignments) {
        await Assignment.create({ ...item, id: undefined }, { transaction });
        results.assignments++;
      }
    }

    await transaction.commit();

    const totalImported = Object.values(results).reduce((sum, count) => sum + count, 0);
    console.log(`✅ Import complete: ${totalImported} new records imported`);

    res.json({
      success: true,
      message: `Import completed: ${totalImported} records imported successfully`,
      data: {
        results,
        totalImported
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Import error:', error);
    res.status(500).json({ message: 'Import failed. Transaction rolled back.', error: error.message });
  }
};

module.exports = { exportData, importData };