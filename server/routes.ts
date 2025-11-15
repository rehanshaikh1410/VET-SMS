import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "./models/userModel.js";
import Quiz from "./models/quizModel.js";
import ClassModel from "./models/classModel.js";
import Subject from "./models/subjectModel.js";
import Timetable from "./models/timetableModel.js";
import Notice from "./models/noticeModel.js";
import QuizResult from "./models/quizResult.js";
import { authenticate, authorize } from "./middlewares/auth.js";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        username: string;
        role: string;
      };
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create an Express router (for /api endpoints)
  const router = (await import("express")).Router();

  // Mount router at /api
  app.use('/api', router);

  // --- Encryption helpers for storing admin-provided plaintext password securely ---
  const SECRET_KEY = process.env.PLAIN_PASS_KEY || 'dev_default_change_me';
  const KEY = crypto.createHash('sha256').update(SECRET_KEY).digest(); // 32 bytes

  function encryptText(plain: string) {
    const iv = crypto.randomBytes(12); // recommended for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return { iv: iv.toString('hex'), content: encrypted.toString('hex'), tag: tag.toString('hex') };
  }

  function decryptObj(obj: { iv: string; content: string; tag: string }) {
    try {
      const iv = Buffer.from(obj.iv, 'hex');
      const encrypted = Buffer.from(obj.content, 'hex');
      const tag = Buffer.from(obj.tag, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString('utf8');
    } catch (err) {
      console.error('Error decrypting stored password:', err);
      return null;
    }
  }

  // 🔹 Health Check
  router.get("/ping", (_req: Request, res: Response) => {
    res.json({ message: "pong" });
  });

  

  // 🔹 Get dashboard stats (admin only)
  router.get("/stats", authenticate, authorize('admin'), async (_req: Request, res: Response) => {
    try {
      const [
        students,
        teachers,
        classes,
        quizzes,
        notices,
        attendanceData
      ] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'teacher' }),
        ClassModel.countDocuments(),
        Quiz.countDocuments(),
        Notice.find().sort({ createdAt: -1 }).limit(5),
        ClassModel.find().select('name attendance').limit(10)
      ]);

      res.json({
        counts: {
          students,
          teachers,
          classes,
          quizzes
        },
        notices,
        performance: {
          attendance: attendanceData.map((c: any) => ({
            name: c.name,
            score: c.attendance || 0
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // 🔹 Get all users (admin only)
  router.get("/users", authenticate, authorize('admin'), async (_req: Request, res: Response) => {
    try {
      const users = await User.find(
        { role: { $in: ['teacher', 'student'] } },
        { password: 0 } // Exclude password field
      );
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // 🔹 Login route
  router.post("/login", async (req: Request, res: Response) => {
    try {
      const { username, password, role } = req.body;

      // Find user by username or email
      const user = await User.findOne({
        $or: [
          { username: username },
          { email: username }
        ]
      });
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify role
      if (user.role !== role) {
        return res.status(401).json({ message: "Invalid role for this account" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT
      const token = jwt.sign(
        { _id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Send response
      res.json({
        token,
        _id: user._id,
        username: user.username,
        role: user.role,
        name: user.name
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });


  // 🔹 Create a new user (signup or admin-created)
  router.post("/users", authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body;

      // Validate required fields
      const required = ["username", "password", "role", "name", "phone"];
      for (const key of required) {
        if (!body[key]) {
          return res.status(400).json({ message: `Missing required field: ${key}` });
        }
      }

      // Only allow admin to create teachers/students
      if (body.role !== 'teacher' && body.role !== 'student') {
        return res.status(400).json({ message: 'Can only create teacher or student accounts' });
      }

      // Check if username already exists
      const existingUser = await User.findOne({ username: body.username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Hash the password and also store an encrypted copy of the original plaintext
      const SALT_ROUNDS = 10;
      const hashedPassword = await bcrypt.hash(body.password, SALT_ROUNDS);
      const encryptedCopy = encryptText(body.password);

      const created = await User.create({
        ...body,
        password: hashedPassword,
        plainPasswordEncrypted: encryptedCopy
      });

      const { password, ...safeUser } = created.toObject();
      res.status(201).json(safeUser);
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Get user by ID
  router.get("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...safeUser } = user.toObject();
      res.json(safeUser);
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Get user by username
  router.get("/users/by-username/:username", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findOne({ username: req.params.username });
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...safeUser } = user.toObject();
      res.json(safeUser);
    } catch (err) {
      next(err);
    }
  });

  // 🔹 List all users (admin/dev only)
  router.get("/users", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await User.find({});
      const safeUsers = users.map((u: any) => {
        const { password, ...rest } = u.toObject();
        return rest;
      });
      res.json(safeUsers);
    } catch (err) {
      next(err);
    }
  });

  // Update user
  router.put("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const update = req.body || {};
      delete update.password; // password not updated here
      const updated = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ message: 'User not found' });
      const { password, ...safe } = updated.toObject();
      res.json(safe);
    } catch (err) {
      next(err);
    }
  });

  // Delete user
  router.delete("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const deleted = await User.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: 'User not found' });
      res.json({ message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Secure login (with bcrypt password check)
  router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password, role } = req.body || {};
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await User.findOne({ username });
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      // Compare hashed passwords
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ message: "Invalid credentials" });

      // Verify role if provided
      if (role && user.role !== role) {
        return res.status(401).json({ message: "Invalid role for this account" });
      }

      // Generate JWT token
      const { _id } = user;
      const token = jwt.sign(
        { _id, username, role: user.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
      );

      const { password: _pw, ...safeUser } = user.toObject();
      res.json({ ...safeUser, token });
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Return current authenticated user
  router.get("/me", authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
      const user = await User.findById(req.user._id).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      console.error('Error in /me:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // 🔹 Seed demo users (for first-time setup)
  router.post("/seed", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await User.find({});
      if (existing.length > 0)
        return res.status(200).json({ message: "Already seeded" });

      const SALT_ROUNDS = 10;
      const demoUsers = [
        {
          username: "admin",
          password: await bcrypt.hash("admin", SALT_ROUNDS),
          role: "admin",
          name: "Administrator",
          email: "admin@school.test",
        },
        {
          username: "teacher1",
          password: await bcrypt.hash("teachpass", SALT_ROUNDS),
          role: "teacher",
          name: "Alice Teacher",
          email: "alice@school.test",
        },
        {
          username: "student1",
          password: await bcrypt.hash("student", SALT_ROUNDS),
          role: "student",
          name: "Bob Student",
          email: "bob@school.test",
        },
      ];

      const created = await User.insertMany(demoUsers);
      const safe = created.map((u: { toObject: () => any }) => {
        const { password, ...rest } = u.toObject();
        return rest;
      });

      res.status(201).json(safe);
    } catch (err) {
      next(err);
    }
  });

    // 🔹 Admin: reveal (reset) a teacher's password after verifying admin's password
    router.post('/admin/teachers/:id/reveal-password', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
      try {
        const adminId = req.user?._id;
        const { adminPassword } = req.body || {};
        const teacherId = req.params.id;

          console.log('✅ Reveal password endpoint hit', { adminId, teacherId });

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
        if (!adminPassword) return res.status(400).json({ message: 'Admin password required' });

        const adminUser = await User.findById(adminId);
          console.log('✅ Admin user found:', adminUser?._id);
        if (!adminUser) return res.status(401).json({ message: 'Admin user not found' });

        const isAdminPwdValid = await bcrypt.compare(adminPassword, adminUser.password);
          console.log('✅ Admin password valid:', isAdminPwdValid);
        if (!isAdminPwdValid) return res.status(403).json({ message: 'Invalid admin password' });

        const teacher = await User.findById(teacherId);
          console.log('✅ Teacher found:', teacher?._id);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

        // If we have an encrypted original password stored, decrypt and return it.
        if (teacher.plainPasswordEncrypted) {
          const decrypted = decryptObj(teacher.plainPasswordEncrypted as any);
          console.log('✅ Decrypted stored teacher password:', !!decrypted);
          if (decrypted) {
            const responseObj = { username: teacher.username, password: decrypted };
            console.log('✅ Sending decrypted credentials:', JSON.stringify({ username: teacher.username }));
            return res.status(200).setHeader('Content-Type', 'application/json').json(responseObj);
          }
        }

        // Fallback: if no stored plaintext copy exists, generate a temporary password,
        // update the teacher password, and return the temp password (original behavior).
        const tmp = `TempPwd${Math.random().toString(36).substring(7).toUpperCase()}`;
        console.log('✅ Generated temp password (fallback):', tmp);

        const SALT_ROUNDS = 10;
        const hashed = await bcrypt.hash(tmp, SALT_ROUNDS);

        // Update teacher password to the temporary password
        teacher.password = hashed as any;
        await teacher.save();
        console.log('✅ Teacher password updated (fallback)');

        // Return the plaintext temporary password to the admin
        const responseObj = { tempPassword: tmp };
        console.log('✅ Sending response:', JSON.stringify(responseObj));
        // Ensure Content-Type is JSON and send as 200
        res.status(200).setHeader('Content-Type', 'application/json').json(responseObj);
      } catch (err) {
          console.error('❌ Error in reveal-password:', err);
          res.status(500).json({ message: 'Internal server error', error: String(err) });
      }
    });
    
    // 🔹 Admin: reveal (view) a student's stored credentials (requires admin password)
    router.post('/admin/students/:id/reveal-password', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
      try {
        const adminId = req.user?._id;
        const { adminPassword } = req.body || {};
        const studentId = req.params.id;

        console.log('✅ Reveal student credentials endpoint hit', { adminId, studentId });

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
        if (!adminPassword) return res.status(400).json({ message: 'Admin password required' });

        const adminUser = await User.findById(adminId);
        if (!adminUser) return res.status(401).json({ message: 'Admin user not found' });

        const isAdminPwdValid = await bcrypt.compare(adminPassword, adminUser.password);
        if (!isAdminPwdValid) return res.status(403).json({ message: 'Invalid admin password' });

        const student = await User.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        if (student.plainPasswordEncrypted) {
          const decrypted = decryptObj(student.plainPasswordEncrypted as any);
          console.log('✅ Decrypted stored student password:', !!decrypted);
          if (decrypted) {
            const responseObj = { username: student.username, password: decrypted };
            console.log('✅ Sending decrypted credentials for student:', JSON.stringify({ username: student.username }));
            return res.status(200).setHeader('Content-Type', 'application/json').json(responseObj);
          }
        }

        // Fallback: rotate password and return temporary password
        const tmp = `TempPwd${Math.random().toString(36).substring(7).toUpperCase()}`;
        const SALT_ROUNDS = 10;
        const hashed = await bcrypt.hash(tmp, SALT_ROUNDS);
        student.password = hashed as any;
        await student.save();
        const responseObj = { tempPassword: tmp };
        console.log('✅ Sending temp password for student (fallback):', JSON.stringify(responseObj));
        return res.status(200).setHeader('Content-Type', 'application/json').json(responseObj);
      } catch (err) {
        console.error('❌ Error in reveal-student-password:', err);
        res.status(500).json({ message: 'Internal server error', error: String(err) });
      }
    });
  // 🔹 Setup demo complete environment (classes, subjects, timetable for student)
  router.get("/setup-demo", async (_req: Request, res: Response, next: NextFunction) => {
    // Allow both GET and POST
    try {
      // Get or create demo class
      let demoClass = await ClassModel.findOne({ name: "Class 10-A" });
      if (!demoClass) {
        demoClass = await ClassModel.create({
          name: "Class 10-A",
          grade: "10",
          section: "A"
        });
      }

      // Get or create demo subjects
      let mathSubject = await Subject.findOne({ name: "Mathematics" });
      if (!mathSubject) {
        mathSubject = await Subject.create({ name: "Mathematics" });
      }

      let englishSubject = await Subject.findOne({ name: "English" });
      if (!englishSubject) {
        englishSubject = await Subject.create({ name: "English" });
      }

      let scienceSubject = await Subject.findOne({ name: "Science" });
      if (!scienceSubject) {
        scienceSubject = await Subject.create({ name: "Science" });
      }

      // Get or create demo teacher
      let teacher = await User.findOne({ username: "teacher1" });
      if (!teacher) {
        teacher = await User.create({
          username: "teacher1",
          password: await bcrypt.hash("teachpass", 10),
          role: "teacher",
          name: "Alice Teacher",
          email: "alice@school.test"
        });
      }

      // Get student and assign to class
      let student = await User.findOne({ username: "student1" });
      if (student && !student.classId) {
        student.classId = demoClass._id.toString();
        await student.save();
      }

      // Create or update demo timetable
      let timetable = await Timetable.findOne({ classId: demoClass._id.toString() });
      if (!timetable) {
        const entries = [
          // Monday
          { day: "Monday", period: 1, subjectId: mathSubject._id.toString(), teacherId: teacher._id.toString(), time: "8:00 - 8:45" },
          { day: "Monday", period: 2, subjectId: englishSubject._id.toString(), teacherId: teacher._id.toString(), time: "8:50 - 9:35" },
          { day: "Monday", period: 3, subjectId: scienceSubject._id.toString(), teacherId: teacher._id.toString(), time: "9:40 - 10:25" },
          // Tuesday
          { day: "Tuesday", period: 1, subjectId: englishSubject._id.toString(), teacherId: teacher._id.toString(), time: "8:00 - 8:45" },
          { day: "Tuesday", period: 2, subjectId: mathSubject._id.toString(), teacherId: teacher._id.toString(), time: "8:50 - 9:35" },
          { day: "Tuesday", period: 3, subjectId: scienceSubject._id.toString(), teacherId: teacher._id.toString(), time: "9:40 - 10:25" },
          // Wednesday
          { day: "Wednesday", period: 1, subjectId: scienceSubject._id.toString(), teacherId: teacher._id.toString(), time: "8:00 - 8:45" },
          { day: "Wednesday", period: 2, subjectId: englishSubject._id.toString(), teacherId: teacher._id.toString(), time: "8:50 - 9:35" },
          { day: "Wednesday", period: 3, subjectId: mathSubject._id.toString(), teacherId: teacher._id.toString(), time: "9:40 - 10:25" },
        ];

        timetable = await Timetable.create({
          classId: demoClass._id.toString(),
          entries
        });
      }

      res.json({
        message: "Demo setup complete!",
        class: { _id: demoClass._id, name: demoClass.name },
        subjects: [mathSubject, englishSubject, scienceSubject],
        teacher: { _id: teacher._id, name: teacher.name },
        student: { _id: student?._id, name: student?.name, classId: student?.classId },
        timetable: timetable
      });
    } catch (err) {
      next(err);
    }
  });

        // 🔹 Get all students and their class assignments (for debugging)
  router.get("/debug/students-classes", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const students = await User.find({ role: 'student' }).select('username name classId');
      const classes = await ClassModel.find({}).select('_id name');
      const timetables = await Timetable.find({}).select('classId');

      res.json({
        students,
        classes,
        timetables: timetables.map((t: any) => ({
          classId: t.classId,
          className: classes.find((c: any) => c._id.toString() === t.classId.toString())?.name
        }))
      });
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Assign student to class by class name
  router.post("/assign-student-by-classname", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentUsername, className } = req.body;
      
      if (!studentUsername || !className) {
        return res.status(400).json({ message: "studentUsername and className are required" });
      }

      // Find student
      const student = await User.findOne({ username: studentUsername, role: 'student' });
      if (!student) {
        return res.status(404).json({ message: `Student '${studentUsername}' not found` });
      }

      // Find class by name
      const classRecord = await ClassModel.findOne({ name: className });
      if (!classRecord) {
        return res.status(404).json({ message: `Class '${className}' not found` });
      }

      // Check if class has a timetable
      const timetable = await Timetable.findOne({ classId: classRecord._id.toString() });
      if (!timetable) {
        return res.status(400).json({ message: `Class '${className}' has no timetable set by admin` });
      }

      // Assign student to class
      student.classId = classRecord._id.toString();
      await student.save();

      res.json({
        success: true,
        message: `Student '${studentUsername}' assigned to '${className}' successfully!`,
        student: {
          username: student.username,
          name: student.name,
          classId: student.classId
        },
        class: {
          _id: classRecord._id,
          name: classRecord.name
        },
        timetable: timetable
      });
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Assign any student to a class by username
  router.post("/assign-to-class", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentUsername, classId } = req.body;
      
      if (!studentUsername || !classId) {
        return res.status(400).json({ message: "studentUsername and classId are required" });
      }

      // Find student
      const student = await User.findOne({ username: studentUsername, role: 'student' });
      if (!student) {
        return res.status(404).json({ message: `Student with username '${studentUsername}' not found` });
      }

      // Find class
      const classExists = await ClassModel.findById(classId);
      if (!classExists) {
        return res.status(404).json({ message: `Class with id '${classId}' not found` });
      }

      // Assign student to class
      student.classId = classId;
      await student.save();

      res.json({
        message: `Student '${studentUsername}' assigned to class '${classExists.name}'`,
        student: { _id: student._id, name: student.name, classId: student.classId }
      });
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Timetables endpoints

  // 🔹 Quiz Routes
  router.post("/quizzes", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quizData = req.body;
      
      // Normalize incoming payloads: accept `classId` or `classIds` as ids or objects; accept `subjectId` as id or object.
      if (quizData) {
        // Normalize single legacy classId object to id string
        if (quizData.classId && typeof quizData.classId === 'object') {
          quizData.classId = (quizData.classId._id || quizData.classId.id || quizData.classId).toString();
        }

        // Normalize classIds array elements (objects -> id strings)
        if (Array.isArray(quizData.classIds)) {
          quizData.classIds = quizData.classIds.map((c: any) => {
            if (!c) return c;
            if (typeof c === 'object') return (c._id || c.id || c).toString();
            return c.toString();
          });
        }

        // If classId present but classIds missing, keep them in sync
        if (quizData.classId && !Array.isArray(quizData.classIds)) {
          quizData.classIds = [quizData.classId];
        }

        // Normalize subjectId if object
        if (quizData.subjectId && typeof quizData.subjectId === 'object') {
          quizData.subjectId = (quizData.subjectId._id || quizData.subjectId.id || quizData.subjectId).toString();
        }
      }

      // Add validation for required fields. Accept either legacy `classId` or new `classIds` array.
      const hasClass = !!(quizData.classId || (Array.isArray(quizData.classIds) && quizData.classIds.length > 0));
      const hasQuestions = Array.isArray(quizData.questions) && quizData.questions.length > 0;
      if (!quizData.title || !hasClass || !quizData.subjectId || !hasQuestions) {
        console.error('Quiz creation validation failed. Incoming payload:', JSON.stringify(quizData));
        return res.status(400).json({ message: "Missing required fields: title, classIds/classId, subjectId, questions" });
      }

      // Create the quiz. If a user is authenticated, set createdBy; otherwise leave it undefined.
      const payload: any = { ...quizData };
      if (req.user?._id) payload.createdBy = req.user._id;

      // Accept either classId (legacy) or classIds (new array)
      if (payload.classId && !payload.classIds) {
        payload.classIds = [payload.classId];
        delete payload.classId;
      }

      const quiz = await Quiz.create(payload);

      res.status(201).json(quiz);

      // 📡 Broadcast to all connected students
      const broadcast = (global as any).broadcastToStudents;
      if (broadcast) {
        broadcast({
          type: 'quiz_created',
          data: quiz
        });
      }
    } catch (err) {
      next(err);
    }
  });

  router.get("/quizzes", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const quizzes = await Quiz.find({}).populate('createdBy', 'name');
      res.json(quizzes);
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Get quizzes for a teacher (quizzes they created)
  router.get("/quizzes/teacher", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teacherId = req.user?._id;
      if (!teacherId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get quizzes created by this teacher
      const quizzes = await Quiz.find({ createdBy: teacherId }).populate('createdBy', 'name');

      // For each quiz, get submission count and class details
      const quizzesWithStats = await Promise.all(
        quizzes.map(async (quiz: any) => {
          const submissionCount = await QuizResult.countDocuments({ quizId: quiz._id });
          // Support multiple classes (classIds) or legacy single classId
          let className = 'N/A';
          try {
            if (Array.isArray(quiz.classIds) && quiz.classIds.length > 0) {
              const classDocs = await ClassModel.find({ _id: { $in: quiz.classIds } });
              className = classDocs.map((cd: any) => `${cd.name}${cd.grade ? ` - ${cd.grade}` : ''}`).join(', ');
            } else if (quiz.classId) {
              const classDoc = await ClassModel.findById(quiz.classId);
              if (classDoc) className = `${classDoc.name}${classDoc.grade ? ` - ${classDoc.grade}` : ''}`;
            }
          } catch (e) {
            // Ignore class lookup errors
          }
          return {
            ...quiz.toObject(),
            submissionCount,
            className
          };
        })
      );

      res.json(quizzesWithStats);
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Get quizzes for a student (filtered by their class)
  router.get("/quizzes/student", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user?._id;
      if (!studentId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Find student's class
      const student = await User.findById(studentId);
      if (!student || !student.classId) {
        return res.json([]); // No class assigned
      }

      // Get quizzes for student's class (supporting both classIds array and legacy classId)
      const quizzes = await Quiz.find({
        $or: [
          { classIds: student.classId },
          { classId: student.classId }
        ]
      })
        .populate('createdBy', 'name')
        .populate('subjectId', 'name');

      // For each quiz, check if student has submitted
      const quizzesWithSubmissions = await Promise.all(
        quizzes.map(async (quiz: any) => {
          const submission = await QuizResult.findOne({
            quizId: quiz._id,
            studentId: studentId
          });
          const quizObj = quiz.toObject();
          
          // Add subjectName for frontend display
          const subjectName = quiz.subjectId?.name || quizObj.subjectId;
          
          return {
            ...quizObj,
            subjectName: subjectName,
            submission: submission ? { score: submission.score, totalMarks: submission.totalMarks } : null,
            status: submission ? 'completed' : 'published'
          };
        })
      );

      res.json(quizzesWithSubmissions);
    } catch (err) {
      next(err);
    }
  });

  router.get("/quizzes/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'name');
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });
      
      // If student is authenticated, include their submission data
      const studentId = req.user?._id;
      let quizData: any = quiz.toObject();
      
      if (studentId && req.user?.role === 'student') {
        const submission = await QuizResult.findOne({
          quizId: quiz._id,
          studentId: studentId
        });
        quizData.submission = submission ? { 
          score: submission.score, 
          totalMarks: submission.totalMarks,
          submittedAt: submission.submittedAt
        } : null;
      }
      
      res.json(quizData);
    } catch (err) {
      next(err);
    }
  });

  // Update quiz
  router.put("/quizzes/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const update = req.body || {};

      // Find the quiz first to check ownership
      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      // Allow update if user is admin or the quiz creator
      if (req.user?.role !== 'admin' && quiz.createdBy?.toString() !== req.user?._id?.toString()) {
        return res.status(403).json({ message: "You can only update quizzes you created" });
      }

      // Ensure createdBy is preserved and not overwritten
      if (update.createdBy) {
        delete update.createdBy;
      }

      // Accept classId (legacy) -> convert to classIds
      if (update.classId && !update.classIds) {
        update.classIds = [update.classId];
        delete update.classId;
      }

      const updated = await Quiz.findByIdAndUpdate(id, update, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ message: 'Quiz not found' });
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating quiz:', err);
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation error: ' + err.message });
      }
      next(err);
    }
  });

  // Delete quiz
  router.delete("/quizzes/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;

      // Find the quiz first to check ownership
      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      // Allow delete if user is admin or the quiz creator
      if (req.user?.role !== 'admin' && quiz.createdBy?.toString() !== req.user?._id?.toString()) {
        return res.status(403).json({ message: "You can only delete quizzes you created" });
      }

      const deleted = await Quiz.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: 'Quiz not found' });
      res.json({ message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Quiz Submission Routes
  router.post("/quiz-submissions", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { quizId, answers } = req.body || {};
      const studentId = req.user?._id;

      if (!quizId || !answers) {
        return res.status(400).json({ message: "quizId and answers are required" });
      }

      // Get quiz details
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Calculate score
      let score = 0;
      const questions = (quiz as any).questions || [];
      // Support two shapes for answers:
      // - positional array of primitives (answers[idx] === correctAnswer)
      // - array of objects { questionId, answer }
      questions.forEach((q: any, idx: number) => {
        try {
          const a = Array.isArray(answers) ? answers[idx] : undefined;
          const value = (a && typeof a === 'object' && 'answer' in a) ? a.answer : a;
          if (value === q.correctAnswer) {
            score++;
          }
        } catch (e) {
          // ignore individual question errors
        }
      });

      // Normalize answers into QuizResult schema shape: array of { questionIndex, selectedAnswer, isCorrect, marks }
      const submissionAnswers = questions.map((q: any, idx: number) => {
        const raw = Array.isArray(answers) ? answers[idx] : undefined;
        const val = (raw && typeof raw === 'object' && 'answer' in raw) ? raw.answer : raw;
        const selectedAnswer = (typeof val === 'string' && !isNaN(Number(val))) ? Number(val) : val;
        const isCorrect = String(selectedAnswer) === String(q.correctAnswer);
        const marks = isCorrect ? (q.marks ?? 1) : 0;
        return {
          questionIndex: idx,
          selectedAnswer: typeof selectedAnswer === 'number' ? selectedAnswer : 0,
          isCorrect,
          marks
        };
      });

      // Save submission
      const submission = await QuizResult.create({
        quizId,
        studentId,
        answers: submissionAnswers,
        score,
        totalMarks: questions.length,
        submittedAt: new Date()
      });

      console.log('✅ Quiz submission saved:', { quizId, studentId, score, totalMarks: questions.length, submissionId: submission._id });

      res.status(201).json(submission);

      // 📡 Broadcast to students (optional: for showing updated quiz status)
      const broadcast = (global as any).broadcastToStudents;
      if (broadcast) {
        broadcast({
          type: 'quiz_submitted',
          data: { quizId, studentId, score }
        });
      }
    } catch (err) {
      next(err);
    }
  });

  router.get("/quiz-submissions/student", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user?._id;
      const submissions = await QuizResult.find({ studentId }).populate('quizId', 'title subjectName totalMarks');
      res.json(submissions);
    } catch (err) {
      next(err);
    }
  });

  // Get submissions for a specific quiz (per-student scores)
  router.get("/quiz-submissions/quiz/:quizId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { quizId } = req.params;
      
      // Find the quiz to check if current user is the creator or admin
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Allow access if user is admin or the quiz creator
      if (req.user?.role !== 'admin' && quiz.createdBy?.toString() !== req.user?._id?.toString()) {
        return res.status(403).json({ message: "You can only view submissions for your own quizzes" });
      }

      // Get all submissions for this quiz, populated with student info including classId
      const submissions = await QuizResult.find({ quizId })
        .populate({
          path: 'studentId',
          select: 'name rollNumber username classId'
        })
        .sort({ submittedAt: -1 });

      // Normalize the response to match frontend expectations
      const normalized = submissions.map((sub: any) => ({
        _id: sub._id,
        quizId: sub.quizId,
        student: {
          _id: sub.studentId?._id,
          name: sub.studentId?.name || '',
          rollNumber: sub.studentId?.rollNumber || '',
          classId: sub.studentId?.classId || ''
        },
        score: sub.score,
        totalMarks: sub.totalMarks,
        submittedAt: sub.submittedAt,
        answers: sub.answers
      }));

      console.log(`✅ Fetched ${normalized.length} submissions for quiz ${quizId}:`, normalized);
      res.json(normalized);
    } catch (err) {
      next(err);
    }
  });

  // Get class-wide quiz performance (subject-wise average)
  router.get("/quiz-performance/class", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user?._id;
      // Find student's class
      const student = await User.findById(studentId);
      if (!student || !student.classId) {
        return res.json([]); // No class, no performance data
      }

      // Get all quizzes for this class
      const quizzes = await Quiz.find({ classId: student.classId });
      if (quizzes.length === 0) {
        return res.json([]);
      }

      const quizIds = quizzes.map((q: any) => q._id);

      // Get all submissions for this class's quizzes
      const allSubmissions = await QuizResult.find({ quizId: { $in: quizIds } });

      // Calculate class average by subject
      const bySubject = new Map<string, { total: number; possible: number; count: number }>();
      allSubmissions.forEach((sub: any) => {
        const quiz = quizzes.find((q: any) => q._id.toString() === sub.quizId.toString());
        if (quiz) {
          const subject = (quiz as any).subjectName || 'Unknown';
          if (!bySubject.has(subject)) {
            bySubject.set(subject, { total: 0, possible: 0, count: 0 });
          }
          const entry = bySubject.get(subject)!;
          entry.total += sub.score;
          entry.possible += sub.totalMarks;
          entry.count += 1;
        }
      });

      const classAverage = Array.from(bySubject.entries()).map(([subject, data]) => ({
        subject,
        average: data.possible > 0 ? Math.round((data.total / data.possible) * 100) : 0,
        submissions: data.count
      }));

      res.json(classAverage);
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Notice Routes
  router.get("/notices", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Filter notices based on user role and audience
      let query: any;
      
      if (req.user?.role === 'admin') {
        // Admins see all notices
        query = {};
      } else if (req.user?.role === 'teacher') {
        // Teachers see:
        // 1. Notices targeted to them (audience: 'all' or 'teachers')
        // 2. All notices they posted themselves (regardless of audience)
        query = {
          $or: [
            { audience: 'all' },
            { audience: 'teachers' },
            { postedBy: req.user._id } // Teachers see their own notices
          ]
        };
      } else {
        // Students see notices targeted to them or everyone
        query = {
          $or: [
            { audience: 'all' },
            { audience: 'students' }
          ]
        };
      }

      const notices = await Notice.find(query)
        .populate('postedBy', 'name')
        .sort({ createdAt: -1 }); // newest first
      res.json(notices);
    } catch (err) {
      next(err);
    }
  });

  router.post("/notices", authenticate, authorize('admin', 'teacher'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, content, priority, audience } = req.body || {};
      
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }

      const notice = await Notice.create({
        title,
        content,
        priority: priority || 'medium',
        audience: audience || 'all',
        postedBy: req.user?._id
      });

      const populated = await Notice.findById(notice._id).populate('postedBy', 'name');
      res.status(201).json(populated);

      // 📡 Broadcast to all connected students
      const broadcast = (global as any).broadcastToStudents;
      if (broadcast) {
        broadcast({
          type: 'notice_created',
          data: populated
        });
      }
    } catch (err) {
      next(err);
    }
  });

  router.put("/notices/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notice = await Notice.findById(req.params.id);
      
      // Allow admins to edit any notice, or teachers to edit their own
      if (req.user?.role !== 'admin' && notice?.postedBy.toString() !== req.user?._id?.toString()) {
        return res.status(403).json({ message: "You can only edit your own notices" });
      }

      const updated = await Notice.findByIdAndUpdate(
        req.params.id,
        req.body || {},
        { new: true, runValidators: true }
      ).populate('postedBy', 'name');
      
      if (!updated) {
        return res.status(404).json({ message: "Notice not found" });
      }
      
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/notices/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notice = await Notice.findById(req.params.id);
      
      // Allow admins to delete any notice, or teachers to delete their own
      if (req.user?.role !== 'admin' && notice?.postedBy.toString() !== req.user?._id?.toString()) {
        return res.status(403).json({ message: "You can only delete your own notices" });
      }

      const deleted = await Notice.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Notice not found" });
      }
      res.json({ message: "Deleted" });
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Stats/Analytics endpoints
  router.get("/stats", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [
        studentCount,
        teacherCount,
        classCount,
        quizCount,
        notices
      ] = await Promise.all([
        User.countDocuments({ role: 'student' }), // Total students
        User.countDocuments({ role: 'teacher' }), // Total teachers
        ClassModel.countDocuments({}), // Total classes
        Quiz.countDocuments({}), // Total quizzes
        Notice.find({}).sort({ createdAt: -1 }).limit(5) // Recent notices
      ]);

      // Get recent quizzes with performance data
      const recentQuizzes = await Quiz.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title classId subjectId totalMarks')
        .populate('createdBy', 'name');

      // Get quiz performance data
      type IQuizResultPopulated = {
        quizId: {
          classId: string;
          totalMarks: number;
          subjectId: {
            name: string;
          };
        };
        score: number;
        totalMarks: number;
      };

      const rawQuizResults = await QuizResult.find({})
        .populate({
          path: 'quizId',
          select: 'subjectId classId totalMarks',
          populate: [
            { path: 'subjectId', select: 'name' }
          ]
        }).lean();

      const quizResults = rawQuizResults as unknown as IQuizResultPopulated[];

      // Calculate class-wise attendance (based on quiz participation)
      const classAttendance = new Map<string, number>();
      let classQuizCounts = new Map<string, number>();

      quizResults.forEach(result => {
        const classId = result.quizId.classId.toString();
        if (!classAttendance.has(classId)) {
          classAttendance.set(classId, 0);
          classQuizCounts.set(classId, 0);
        }
        classAttendance.set(classId, classAttendance.get(classId)! + 1);
        classQuizCounts.set(classId, classQuizCounts.get(classId)! + 1);
      });

      const classes = await ClassModel.find({}).select('name _id').lean();
      const studentCounts = await User.aggregate([
        { $match: { role: 'student' } },
        { $group: { _id: '$classId', count: { $sum: 1 } } }
      ]);

      const studentsByClass = new Map<string, number>(
        studentCounts.map((sc: { _id: mongoose.Types.ObjectId; count: number }) => 
          [sc._id.toString(), sc.count]
        )
      );

      const attendanceData = classes.map(c => {
        const classId = c._id.toString();
        const totalPossible = (studentsByClass.get(classId) || 0) * (classQuizCounts.get(classId) || 0);
        const actual = classAttendance.get(classId) || 0;
        const score = totalPossible > 0 ? Math.round((actual / totalPossible) * 100) : 0;
        return {
          name: c.name,
          score
        };
      });

      // Calculate class-wise performance
      const classPerformance = new Map<string, number>();
      const classScoreCounts = new Map<string, number>();

      quizResults.forEach(result => {
        const classId = result.quizId.classId.toString();
        if (!classPerformance.has(classId)) {
          classPerformance.set(classId, 0);
          classScoreCounts.set(classId, 0);
        }
        const percentScore = (result.score / result.totalMarks) * 100;
        classPerformance.set(classId, classPerformance.get(classId)! + percentScore);
        classScoreCounts.set(classId, classScoreCounts.get(classId)! + 1);
      });

      const classWisePerformance = classes.map(c => ({
        name: c.name,
        score: Math.round(classPerformance.get(c._id.toString()) || 0 / (classScoreCounts.get(c._id.toString()) || 1))
      }));

      res.json({
        counts: {
          students: studentCount,
          teachers: teacherCount,
          classes: classCount,
          quizzes: quizCount
        },
        recentQuizzes,
        notices,
        performance: {
          attendance: attendanceData,
          classWise: classWisePerformance
        }
      });
    } catch (err) {
      next(err);
    }
  });

  // router already mounted at top

  // 🔹 Teachers endpoints (list & create)
  // 🔹 Students endpoints (list & create)
  router.get("/students", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const students = await User.find({ role: 'student' });
      const safe = students.map((u: any) => {
        const { password, ...rest } = u.toObject();
        return rest;
      });
      res.json(safe);
    } catch (err) {
      next(err);
    }
  });

  router.post("/students", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, phone, rollNumber, classId, username, password } = req.body || {};
      if (!name) return res.status(400).json({ message: 'Name is required' });
      if (!username) return res.status(400).json({ message: 'Username is required' });
      if (!password) return res.status(400).json({ message: 'Password is required' });

      // Check if username already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) return res.status(400).json({ message: 'Username already exists' });

      const SALT_ROUNDS = 10;
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Store an encrypted copy of the plaintext password so admin can view credentials later
      const encryptedCopy = encryptText(password);

      const created = await User.create({
        username,
        password: hashedPassword,
        role: 'student',
        name,
        email,
        phone,
        rollNumber,
        classId,
        plainPasswordEncrypted: encryptedCopy
      });

      const { password: _, ...safeUser } = created.toObject();
      res.status(201).json(safeUser);
    } catch (err) {
      next(err);
    }
  });

  router.get("/teachers", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const teachers = await User.find({ role: 'teacher' });
      const safe = teachers.map((u: any) => {
        const { password, ...rest } = u.toObject();
        return rest;
      });
      res.json(safe);
    } catch (err) {
      next(err);
    }
  });

  router.post("/teachers", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, phone, subjectId, experience, username, password } = req.body || {};
      if (!name) return res.status(400).json({ message: 'Name is required' });
      if (!username) return res.status(400).json({ message: 'Username is required' });
      if (!password) return res.status(400).json({ message: 'Password is required' });

      // Check if username already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) return res.status(400).json({ message: 'Username already exists' });

      const SALT_ROUNDS = 10;
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Store an encrypted copy of the plaintext password so admin can view the credentials later
      const encryptedCopy = encryptText(password);

      const created = await User.create({
        username,
        password: hashedPassword,
        role: 'teacher',
        name,
        email,
        phone,
        subjectId,
        experience,
        plainPasswordEncrypted: encryptedCopy
      });

      const { password: _, ...safeUser } = created.toObject();
      res.status(201).json(safeUser);
    } catch (err) {
      next(err);
    }
  });

  // Update teacher
  router.put("/teachers/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const update = req.body || {};
      // Prevent role change via this endpoint
      delete update.role;
      // Don't allow password updates here
      delete update.password;

  const updated = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ message: 'Teacher not found' });
      const { password, ...safe } = updated.toObject();
      res.json(safe);
    } catch (err) {
      next(err);
    }
  });

  // Delete teacher
  router.delete("/teachers/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const deleted = await User.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: 'Teacher not found' });
      res.json({ message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Classes endpoints
  router.get("/classes", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const classes = await ClassModel.find({}).populate('classTeacher', 'name');
      res.json(classes);
    } catch (err) {
      next(err);
    }
  });

  router.post("/classes", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, grade, classTeacher } = req.body || {};
      if (!name) return res.status(400).json({ message: 'Name required' });
      const created = await ClassModel.create({ name, grade, classTeacher });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put("/classes/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await ClassModel.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
      if (!updated) return res.status(404).json({ message: 'Class not found' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/classes/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await ClassModel.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Class not found' });
      res.json({ message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Subjects endpoints
  router.get("/subjects", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const subjects = await Subject.find({})
        .populate('teacher', 'name')
        .populate('teachers', 'name')
        .populate('classes', '_id name');
      res.json(subjects);
    } catch (err) {
      next(err);
    }
  });

  router.post("/subjects", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, code, teacher, teachers } = req.body || {};
      if (!name) return res.status(400).json({ message: 'Name required' });
      
      // Support both single teacher (teacher) and multiple teachers (teachers) for backward compatibility
      const teacherData = teachers || (teacher ? [teacher] : []);
      
      const created = await Subject.create({ 
        name, 
        code, 
        teacher,
        teachers: teacherData
      });
      const populated = await Subject.findById(created._id)
        .populate('teacher', 'name')
        .populate('teachers', 'name')
        .populate('classes', '_id name');
      res.status(201).json(populated);
    } catch (err) {
      next(err);
    }
  });

  router.put("/subjects/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updateData = req.body || {};
      
      // If teachers array is provided, update both teacher (first) and teachers (all)
      if (updateData.teachers && Array.isArray(updateData.teachers)) {
        updateData.teacher = updateData.teachers[0] || undefined;
      } else if (updateData.teacher) {
        // If single teacher is provided, also update teachers array
        updateData.teachers = [updateData.teacher];
      }
      
      const updated = await Subject.findByIdAndUpdate(req.params.id, updateData, { new: true })
        .populate('teacher', 'name')
        .populate('teachers', 'name')
        .populate('classes', '_id name');
      if (!updated) return res.status(404).json({ message: 'Subject not found' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/subjects/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await Subject.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Subject not found' });
      res.json({ message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Timetables endpoints
  // Get timetable for current authenticated student (by classId in their user record)
  router.get("/timetables/for-current-student", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user?._id;
      console.log('📚 /timetables/for-current-student called:', { studentId });
      
      if (!studentId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Find student's class
      const student = await User.findById(studentId);
      console.log('📚 Student found:', { studentId, classId: student?.classId });
      
      if (!student || !student.classId) {
        console.log('📚 No class assigned to student');
        return res.json(null); // No class assigned
      }

      // Get timetable for student's class
      const timetable = await Timetable.findOne({ classId: student.classId });
      console.log('📚 Timetable found:', { classId: student.classId, entriesCount: timetable?.entries?.length });
      res.json(timetable || null);
    } catch (err) {
      console.error('❌ Error in /timetables/for-current-student:', err);
      next(err);
    }
  });

  // Get timetable for current authenticated teacher
  router.get("/timetables/teacher", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teacherId = req.user?._id;
      console.log('📚 /timetables/teacher called:', { teacherId });
      
      if (!teacherId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get all classes, subjects and their timetables
      const allClasses = await ClassModel.find({});
      const allSubjects = await Subject.find({});
      const allTimetables = await Timetable.find({});

      // Flatten all timetable entries and filter by this teacher's ID
      const teacherEntries: any[] = [];
      
      for (const timetable of allTimetables) {
        const classInfo = allClasses.find((c: any) => c._id.toString() === timetable.classId);
        
        if (timetable.entries) {
          for (const entry of timetable.entries) {
            // Match entries by teacherId
            if (entry.teacherId === String(teacherId) || entry.teacherId === teacherId) {
              // Find subject name from subjectId
              const subjectInfo = allSubjects.find((s: any) => 
                s._id.toString() === (entry.subjectId as any).toString() || 
                s._id === entry.subjectId
              );
              
              teacherEntries.push({
                ...entry,
                classId: timetable.classId,
                className: classInfo?.name || 'Unknown Class',
                subjectName: subjectInfo?.name || 'N/A',
                dayOfWeek: entry.day || 'Unknown',
                timeSlot: entry.time || 'N/A',
                period: entry.period
              });
            }
          }
        }
      }

      console.log('📚 Teacher timetable entries found:', teacherEntries.length, teacherEntries);
      res.json(teacherEntries);
    } catch (err) {
      console.error('❌ Error in /timetables/teacher:', err);
      next(err);
    }
  });

  // List / query by classId
  router.get("/timetables", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const classId = req.query.classId as string | undefined;
      const filter: any = {};
      if (classId) filter.classId = classId;
      const items = await Timetable.find(filter);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  // Create timetable for a class
  router.post("/timetables", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { classId, entries } = req.body || {};
      if (!classId) return res.status(400).json({ message: 'classId is required' });
      const created = await Timetable.create({ classId, entries: entries || [] });
      res.status(201).json(created);

      // 📡 Broadcast to all students
      const broadcast = (global as any).broadcastToStudents;
      if (broadcast) {
        broadcast({
          type: 'timetable_updated',
          data: { classId, timetable: created }
        });
      }
    } catch (err) {
      next(err);
    }
  });

  // Update timetable
  router.put("/timetables/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const update = req.body || {};
      const updated = await Timetable.findByIdAndUpdate(id, update, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ message: 'Timetable not found' });
      res.json(updated);

      // 📡 Broadcast to all students
      const broadcast = (global as any).broadcastToStudents;
      if (broadcast) {
        broadcast({
          type: 'timetable_updated',
          data: { timetable: updated }
        });
      }
    } catch (err) {
      next(err);
    }
  });

  // Delete timetable
  router.delete("/timetables/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await Timetable.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Timetable not found' });
      res.json({ message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  });

  // 🔹 Attendance endpoints
  router.post("/attendance", authenticate, authorize('teacher'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { classId, subjectId, date, studentAttendance } = req.body || {};
      
      if (!classId || !date || !studentAttendance) {
        return res.status(400).json({ message: "classId, date, and studentAttendance are required" });
      }

      // Save attendance records with subject information
      // If a record for the same student/date/subject already exists, update it
      const savedRecords = await Promise.all(studentAttendance.map(async (record: any) => {
        const student = await User.findById(record.studentId);
        if (!student) return null;

        // Normalize the provided date to day-precision for comparison
        const markDate = new Date(date);
        markDate.setHours(0,0,0,0);

        // Find existing attendance entry for same day and subject (if any)
        const existingIndex = (student.attendance || []).findIndex((a: any) => {
          try {
            const aDate = new Date(a.date);
            aDate.setHours(0,0,0,0);
            const sameDay = aDate.getTime() === markDate.getTime();
            const aSub = a.subjectId ? String(a.subjectId) : '';
            const sub = subjectId ? String(subjectId) : '';
            const sameSubject = aSub === sub;
            return sameDay && sameSubject;
          } catch (e) {
            return false;
          }
        });

        if (existingIndex >= 0) {
          // Update existing entry in place
          if (student.attendance) {
            student.attendance[existingIndex].status = record.status;
            student.attendance[existingIndex].markedBy = req.user?._id as any;
            student.attendance[existingIndex].date = new Date(date);
          }
        } else {
          // Append new attendance entry
          if (!student.attendance) {
            student.attendance = [];
          }
          student.attendance.push({
            date: new Date(date),
            classId,
            subjectId: subjectId || null,
            status: record.status,
            markedBy: req.user?._id as any
          });
        }

        await student.save();
        return student;
      }));

      res.status(201).json({
        classId,
        date,
        recordsUpdated: studentAttendance.length,
        records: savedRecords
      });

      // 📡 Broadcast to all students
      const broadcast = (global as any).broadcastToStudents;
      if (broadcast) {
        broadcast({
          type: 'attendance_marked',
          data: { classId, date, count: studentAttendance.length }
        });
      }
    } catch (err) {
      next(err);
    }
  });

  // Get attendance for a student
  router.get("/attendance/student", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user?._id;
      const student = await User.findById(studentId).select('attendance classId');
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Get all valid subject IDs to filter out deleted subjects
      const validSubjects = await Subject.find({}).select('_id');
      const validSubjectIds = new Set(validSubjects.map(s => s._id.toString()));

      let attendanceRecords = student.attendance || [];
      
      // Filter out records with deleted subjects
      attendanceRecords = attendanceRecords.filter((record: any) => {
        if (!record.subjectId) return false; // Remove records without subjectId (old data)
        return validSubjectIds.has(record.subjectId.toString());
      });

      // Remove deleted records from student document if any were filtered
      if ((student.attendance || []).length > attendanceRecords.length) {
        student.attendance = attendanceRecords;
        await student.save();
      }
      
      // Populate subject names and period information for attendance records
      const enrichedRecords = await Promise.all(
        attendanceRecords.map(async (record: any) => {
          const recordObj = record.toObject ? record.toObject() : record;
          
          // If record has subjectId, fetch subject name and period
          if (recordObj.subjectId) {
            try {
              const subject = await Subject.findById(recordObj.subjectId).select('name');
              if (subject) {
                recordObj.subjectName = subject.name;
              } else {
                recordObj.subjectName = 'General';
              }
            } catch (err) {
              console.error('Error fetching subject:', err);
              recordObj.subjectName = 'General';
            }
            
            // Get period information from timetable
            try {
              const dayOfWeek = new Date(recordObj.date).getDay();
              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const dayName = dayNames[dayOfWeek];
              
              const timetable = await Timetable.findOne({
                classId: recordObj.classId
              });
              
              if (timetable && timetable.entries) {
                // Find the entry that matches the day and subject
                const matchingEntry = timetable.entries.find((entry: any) => 
                  entry.day === dayName && entry.subjectId === recordObj.subjectId.toString()
                );
                
                if (matchingEntry) {
                  recordObj.period = matchingEntry.period;
                }
              }
            } catch (err) {
              console.error('Error fetching timetable period:', err);
              // Period remains undefined if not found
            }
          } else {
            recordObj.subjectName = 'General';
          }
          
          // Ensure period has a default value
          if (!recordObj.period) {
            recordObj.period = 1;
          }
          
          return recordObj;
        })
      );

      // Prevent caching of this response
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json(enrichedRecords);
    } catch (err) {
      next(err);
    }
  });

  // Get attendance for a class (teacher only)
  router.get("/attendance/class/:classId", authenticate, authorize('teacher'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { classId } = req.params;
      
      // Get all students in the class
      const students = await User.find({
        classId,
        role: 'student'
      }).select('_id name attendance');

      const classAttendance = students.map((student: any) => ({
        studentId: student._id,
        name: student.name,
        attendance: student.attendance || []
      }));

      res.json(classAttendance);
    } catch (err) {
      next(err);
    }
  });

  // Get attendance report for a class with filtering by date range, week, or month
  router.get("/attendance/report/:classId", authenticate, authorize('teacher', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { classId } = req.params;
      const { startDate, endDate, filterType, subjectId } = req.query; // filterType: 'date', 'week', 'month'

      // Get all students in the class
      const students = await User.find({
        classId,
        role: 'student'
      }).select('_id name rollNumber attendance classId');

      let dateFilterStart: Date | null = null;
      let dateFilterEnd: Date | null = null;

      // Parse filter dates
      if (startDate && endDate) {
        dateFilterStart = new Date(startDate as string);
        dateFilterEnd = new Date(endDate as string);
        dateFilterEnd.setHours(23, 59, 59, 999);
      } else if (filterType === 'month') {
        // Default to current month
        const now = new Date();
        dateFilterStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFilterEnd.setHours(23, 59, 59, 999);
      } else if (filterType === 'week') {
        // Default to current week
        const now = new Date();
        const dayOfWeek = now.getDay();
        dateFilterStart = new Date(now);
        dateFilterStart.setDate(now.getDate() - dayOfWeek);
        dateFilterStart.setHours(0, 0, 0, 0);
        dateFilterEnd = new Date(dateFilterStart);
        dateFilterEnd.setDate(dateFilterStart.getDate() + 6);
        dateFilterEnd.setHours(23, 59, 59, 999);
      }

      // Enrich with subject and period information
      const enrichedStudents = await Promise.all(
        students.map(async (student: any) => {
          let filteredAttendance = student.attendance || [];

          // Filter by date range if specified
          if (dateFilterStart && dateFilterEnd) {
            filteredAttendance = filteredAttendance.filter((a: any) => {
              const attendanceDate = new Date(a.date);
              return attendanceDate >= dateFilterStart && attendanceDate <= dateFilterEnd;
            });
          }

          // Filter by subject if provided
          if (subjectId) {
            filteredAttendance = filteredAttendance.filter((a: any) => String(a.subjectId) === String(subjectId));
          }

          // Populate subject names and period info
          const enrichedAttendance = await Promise.all(
            filteredAttendance.map(async (attendance: any) => {
                // Convert Mongoose subdocument to plain object
                const attendanceObj = attendance.toObject ? attendance.toObject() : { ...attendance };
              
                // Ensure date is properly formatted
                if (attendanceObj.date) {
                  attendanceObj.date = new Date(attendanceObj.date).toISOString();
                }
              
                // Ensure status exists
                if (!attendanceObj.status) {
                  attendanceObj.status = 'Unknown';
                }

              // Fetch subject name
              if (attendance.subjectId) {
                try {
                  const subject = await Subject.findById(attendance.subjectId).select('name');
                  if (subject) {
                    attendanceObj.subjectName = subject.name;
                  }
                } catch (err) {
                  // Subject not found
                }
              }

              // Fetch period from timetable
              if (attendance.classId && attendance.subjectId) {
                try {
                  const dayOfWeek = new Date(attendance.date).getDay();
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  const dayName = dayNames[dayOfWeek];

                  const timetable = await Timetable.findOne({ classId: attendance.classId });
                  if (timetable && timetable.entries) {
                    const matchingEntry = timetable.entries.find((entry: any) =>
                      entry.day === dayName && entry.subjectId === attendance.subjectId.toString()
                    );
                    if (matchingEntry) {
                      attendanceObj.period = matchingEntry.period;
                    }
                  }
                } catch (err) {
                  // Period lookup failed, continue
                }
              }

              return attendanceObj;
            })
          );

          return {
            studentId: student._id,
            name: student.name,
            rollNumber: student.rollNumber,
            attendance: enrichedAttendance
          };
        })
      );

      res.json({
        classId,
        filterType: filterType || 'custom',
        startDate: dateFilterStart,
        endDate: dateFilterEnd,
        students: enrichedStudents
      });
      
        // Log for debugging
        if (enrichedStudents.length > 0 && enrichedStudents[0].attendance.length > 0) {
          console.log('Sample attendance record:', JSON.stringify(enrichedStudents[0].attendance[0], null, 2));
        }
    } catch (err) {
      next(err);
    }
  });

  // Update attendance record (allow teacher to edit previously marked attendance)
  // Can be called with explicit attendanceIndex (PUT /attendance/:studentId/:attendanceIndex)
  // or with date/subject in body to auto-find the index (PUT /attendance/:studentId)
  router.put("/attendance/:studentId/:attendanceIndex?", authenticate, authorize('teacher'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId, attendanceIndex } = req.params;
      const { status, date, subjectId } = req.body;

      console.log('🔄 PUT /attendance request:', { studentId, attendanceIndex, status, date, subjectId });

      if (!['Present', 'Absent', 'Leave'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be Present, Absent, or Leave' });
      }

      const student = await User.findById(studentId);
      if (!student) {
        console.log('❌ Student not found:', studentId);
        return res.status(404).json({ message: 'Student not found' });
      }

      console.log(`✓ Student found: ${student.name}, has ${(student.attendance || []).length} attendance records`);

      let index = -1;

      // If attendanceIndex provided, use it directly
      if (attendanceIndex !== undefined && attendanceIndex !== '') {
        index = parseInt(attendanceIndex, 10);
        if (isNaN(index) || index < 0 || index >= (student.attendance || []).length) {
          return res.status(400).json({ message: 'Invalid attendance record index' });
        }
        console.log(`✓ Using explicit index: ${index}`);
      } else if (date && subjectId) {
        // Auto-find by date and subjectId (for checking submitted attendance)
        const markDate = new Date(date);
        markDate.setHours(0, 0, 0, 0);
        
        console.log(`🔍 Searching for attendance: date=${markDate.toISOString()}, subjectId=${subjectId}`);

        index = (student.attendance || []).findIndex((a: any) => {
          try {
            const aDate = new Date(a.date);
            aDate.setHours(0, 0, 0, 0);
            const sameDay = aDate.getTime() === markDate.getTime();
            const aSub = a.subjectId ? String(a.subjectId) : '';
            const sub = String(subjectId);
            const sameSubject = aSub === sub;
            
            if (sameDay && sameSubject) {
              console.log(`✓ Found matching record: ${a.date}, subject: ${aSub}, status: ${a.status}`);
            }
            
            return sameDay && sameSubject;
          } catch (e) {
            console.error('Error in findIndex:', e);
            return false;
          }
        });

        if (index === -1) {
          console.log('❌ Attendance record not found');
          return res.status(404).json({ message: 'Attendance record not found for the given date and subject' });
        }
      } else {
        return res.status(400).json({ message: 'Either attendanceIndex or (date + subjectId) required' });
      }

      console.log(`📝 Updating record at index ${index}: ${student.attendance?.[index]?.status} → ${status}`);

      if (student.attendance && student.attendance[index]) {
        student.attendance[index].status = status;
        // update markedBy and updated date
        student.attendance[index].markedBy = req.user?._id as any;
        const oldDate = student.attendance[index].date;
        student.attendance[index].date = oldDate ? new Date(oldDate) : new Date();
      }
      await student.save();

      console.log(`✅ Record saved for ${student.name}: ${status}`);

      // Broadcast update to connected clients so students refresh in real-time
      const broadcast = (global as any).broadcastToStudents;
      if (broadcast && student.attendance && student.attendance[index]) {
        try {
          const broadcastData = {
            type: 'attendance_updated',
            data: {
              studentId,
              attendanceIndex: index,
              record: student.attendance?.[index],
              studentName: student.name
            }
          };
          console.log('📡 Broadcasting:', JSON.stringify(broadcastData));
          broadcast(broadcastData);
        } catch (e) {
          console.error('Failed to broadcast attendance update', e);
        }
      }

      res.json({
        message: 'Attendance updated successfully',
        record: student.attendance?.[index],
        studentName: student.name
      });
    } catch (err) {
      console.error('❌ Error in PUT /attendance:', err);
      next(err);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
