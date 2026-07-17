# PKBM Administrative System - Deployment Guide

## 📋 Overview

This document provides step-by-step instructions for deploying the PKBM (Pusat Kegiatan Belajar Mengajar) Administrative System to your Supabase instance.

## 🗄️ Database Migration

### Step 1: Backup Current Database
Before deploying, create a backup:
1. Go to Supabase Dashboard > SQL Editor
2. Run: `pg_dump -h <your-host> -U <your-user> -d <your-db> > backup_before_pkbm.sql`
3. Or use Supabase's built-in backup feature

### Step 2: Deploy PKBM Schema

#### Option A: Complete Replacement (Recommended for new deployments)
If you're setting up the KSI-ON system from scratch:
1. Open Supabase Dashboard → SQL Editor
2. Run the contents of `sql/setup.sql` (or your existing main schema)
3. Then run the contents of `sql/pkbm_administration.sql`

#### Option B: Add to Existing Installation
If you already have KSI-ON running and want to add PKBM features:
1. Open Supabase Dashboard → SQL Editor
2. Run ONLY the contents of `sql/pkbm_administration.sql`
3. This will add PKBM tables without affecting existing LMS tables

**Important**: The PKBM schema is designed to be additive and non-disruptive to existing LMS functionality.

### Step 3: Verify Tables Created

After running the SQL, verify that these new tables exist:
- `classes`
- `teaching_journals`
- `student_attendance`
- `student_evaluations`
- `teacher_evaluations`
- `class_students`

Also verify these views were created:
- `v_teacher_activity_summary`
- `v_student_performance_summary`
- `v_class_attendance_summary`

Go to Supabase Dashboard → Database → Tables to confirm.

### Step 4: Enable Realtime (Optional but Recommended)

For real-time updates in the admin monitoring features:
1. Go to Supabase Dashboard → Database → Realtime
2. Enable Realtime for these tables:
   - `teaching_journals`
   - `student_attendance`
   - `student_evaluations`
   - `teacher_evaluations`

## 🔐 Permission Setup

### Row Level Security (RLS)

The SQL file automatically enables RLS on all PKBM tables. Verify:
1. Go to Supabase Dashboard → Table Editor
2. For each PKBM table, check that "RLS Enabled" is ON
3. Check that policies are created correctly:

**Classes Table Policies:**
- ✅ Teachers can view their own classes
- ✅ Teachers can view classes they're enrolled in (as students)
- ✅ Admins can manage all classes

**Teaching Journals Policies:**
- ✅ Teachers can manage own journals
- ✅ Admins can view all journals

**Student Attendance Policies:**
- ✅ Teachers can manage attendance for their classes
- ✅ Admins can manage all attendance
- ✅ Students can view own attendance

**Student Evaluations Policies:**
- ✅ Teachers can manage evaluations for their classes
- ✅ Admins can manage all evaluations
- ✅ Students can view own evaluations

**Teacher Evaluations Policies:**
- ✅ Admins can manage all teacher evaluations
- ✅ Teachers can view own evaluations

**Class Students Policies:**
- ✅ Teachers can manage students in their classes
- ✅ Admins can manage all class enrollments
- ✅ Students can view own enrollments

### Testing Permissions

Test with different user roles:

**As Teacher:**
1. Login as a teacher user
2. Verify you can only see classes you teach or are enrolled in
3. Try to access another teacher's journal → should be blocked
4. Create a test journal → should succeed

**As Admin:**
1. Login as admin user
2. Verify you can see ALL classes, journals, attendance
3. Try to delete a class → should succeed
4. Try to create teacher evaluation → should succeed

**As Student:**
1. Login as student user
2. Verify you can only see your own attendance/evaluations
3. Try to access admin menu → should be hidden

## 🎨 Frontend Integration

The frontend code is already integrated. No additional setup needed, but verify:

### Teacher Dashboard
- Sidebar should show "Administrasi" section with:
  - Jurnal Mengajar
  - Absensi Siswa
  - Penilaian Siswa

### Admin Dashboard
- Sidebar should show "Administrasi" section with:
  - Data Kelas
  - Data Pengajar
  - Data Siswa
  - Monitoring Mengajar
  - Evaluasi Pengajar
  - Analisis Pembelajaran
  - Laporan

## 🖨️ Print System Testing

Test print functionality for each admin report:

1. **Class List Print** (ClassManagement)
   - Go to Data Kelas
   - Click "Cetak" button
   - Verify A4 layout with header, table, footer

2. **Teacher Report Print** (TeacherManagement)
   - Go to Data Pengajar
   - Click eye icon on a teacher
   - Click "Cetak" in modal
   - Verify teacher info + evaluation history

3. **Student Report Print** (StudentManagement)
   - Go to Data Siswa
   - Click eye icon on a student
   - Verify student details + evaluations

4. **Monitoring Report Print** (TeachingMonitoring)
   - Go to Monitoring Mengajar
   - Apply filters if needed
   - Click "Cetak Laporan"
   - Verify filtered data appears correctly

5. **Evaluation Summary Print** (TeacherEvaluation)
   - Go to Evaluasi Pengajar
   - Click "Cetak Rekap"
   - Verify summary table with averages

6. **Analytics Report Print** (LearningAnalytics)
   - Go to Analisis Pembelajaran
   - Click "Cetak Laporan"
   - Verify stats + teacher activity + class stats

7. **General Reports Print** (ReportsModule)
   - Go to Laporan
   - Select report type (Attendance, Grades, etc.)
   - Set date range
   - Click Generate, then "Cetak Sekarang"
   - Verify data matches selected type

## 📊 Analytics Views Usage

The created views can be used in your frontend for faster analytics:

```javascript
// Example: Get teacher activity stats
const { data } = await supabase
  .from('v_teacher_activity_summary')
  .select('*');

// Example: Get student performance
const { data } = await supabase
  .from('v_student_performance_summary')
  .select('*')
  .eq('student_id', studentId);

// Example: Get class attendance stats
const { data } = await supabase
  .from('v_class_attendance_summary')
  .select('*');
```

## 🐛 Troubleshooting

### Issue: "Relation does not exist"
**Solution**: Tables weren't created. Re-run `sql/pkbm_administration.sql` in Supabase SQL Editor.

### Issue: "Permission denied for relation classes"
**Solution**: RLS policies not applied. Check that `ALTER TABLE classes ENABLE ROW LEVEL SECURITY;` ran successfully.

### Issue: Teacher can't see their classes
**Solution**: Verify `teacher_id` in `classes` table matches the authenticated user's ID.

### Issue: Print not working
**Solution**: Browser popup blocker may be blocking `window.open()`. Allow popups for your domain.

### Issue: Data not showing in admin modules
**Solution**: Ensure you have actual data. Create test data first:
- Admin: Create some classes
- Teacher: Create teaching journals
- Then check admin views

## 🔄 Rollback

If you need to remove PKBM system:
1. Drop all PKBM tables:
```sql
DROP TABLE IF EXISTS class_students CASCADE;
DROP TABLE IF EXISTS teacher_evaluations CASCADE;
DROP TABLE IF EXISTS student_evaluations CASCADE;
DROP TABLE IF EXISTS student_attendance CASCADE;
DROP TABLE IF EXISTS teaching_journals CASCADE;
DROP TABLE IF EXISTS classes CASCADE;

DROP VIEW IF EXISTS v_teacher_activity_summary;
DROP VIEW IF EXISTS v_student_performance_summary;
DROP VIEW IF EXISTS v_class_attendance_summary;
```
2. Drop functions/triggers if needed
3. Remove frontend modules (but keep files if you might reuse)

## 📈 Performance Optimization

The schema includes indexes on all foreign keys and frequently queried columns. For large datasets:

1. **Additional Indexes** (if needed):
```sql
CREATE INDEX idx_teaching_journals_teacher_date ON teaching_journals(teacher_id, date DESC);
CREATE INDEX idx_student_evaluations_class_date ON student_evaluations(class_id, date DESC);
```

2. **Query Optimization**:
- Use the provided views for common aggregations
- Filter by date ranges when querying journals/evaluations
- Use `SELECT * FROM v_teacher_activity_summary` instead of manual joins

## ✅ Pre-Launch Checklist

- [ ] SQL executed successfully without errors
- [ ] All 6 PKBM tables exist in database
- [ ] All 3 analytics views exist
- [ ] RLS enabled on all tables
- [ ] RLS policies created correctly
- [ ] Realtime enabled (optional but recommended)
- [ ] Teacher sidebar shows Administrasi menu
- [ ] Admin sidebar shows Administrasi menu
- [ ] Teacher can create journal → success
- [ ] Teacher can't see other teachers' data → confirmed
- [ ] Admin can see all data → confirmed
- [ ] Print buttons open print dialog → confirmed
- [ ] All print templates render correctly → confirmed
- [ ] Date filters work in monitoring → confirmed
- [ ] Attendance status options work → confirmed
- [ ] Evaluation score slider works → confirmed

## 🎯 Usage Examples

### Teacher Workflow
1. Login as teacher
2. Click "Jurnal Mengajar" → Create journal for today's class
3. Click "Absensi Siswa" → Select journal → Mark student attendance
4. Click "Penilaian Siswa" → Select student → Input score & feedback
5. Click print icons to generate reports

### Admin Workflow
1. Login as admin
2. "Data Kelas" → Manage class information
3. "Data Pengajar" → View teacher stats + evaluate teachers
4. "Monitoring Mengajar" → Filter by date/teacher/class → See all activity
5. "Analisis Pembelajaran" → View system-wide analytics
6. "Laporan" → Select report type → Generate → Print

## 📞 Support

If you encounter issues:
1. Check Supabase logs (Database → Logs)
2. Verify RLS policies are correct
3. Test with PostgREST directly: `GET /rest/v1/classes`
4. Check browser console for frontend errors
5. Ensure user roles are correctly set in `profiles` table

---

**Version**: 1.0.0
**Last Updated**: 2026-05-03
**Compatible with KSI-ON LMS**: v1.0+
