import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { BookOpen, ArrowRight, CheckCircle, PlusCircle, BookmarkCheck, User, Calendar } from 'lucide-react';

const EnrollmentModule = () => {
  const { user, role } = useAuth();
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      // Get all courses that the user is not enrolled in
      if (role === 'murid') {
        // Get all courses
        const { data: allCourses, error: allCoursesError } = await supabase
          .from('courses')
          .select(`
            *,
            profiles (
              email
            )
          `);

        if (allCoursesError) throw allCoursesError;

        // Get enrolled course IDs
        const { data: enrolledData, error: enrolledError } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', user.id);

        if (enrolledError) throw enrolledError;

        const enrolledIds = enrolledData.map(item => item.course_id);
        const available = allCourses.filter(course => !enrolledIds.includes(course.id));
        
        setAvailableCourses(available);
        
        // Get enrolled courses
        const enrolledCourseDetails = allCourses.filter(course => enrolledIds.includes(course.id));
        setEnrolledCourses(enrolledCourseDetails);
      } else if (role === 'guru') {
        // Teachers see courses they teach
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            profiles (
              email
            )
          `)
          .eq('instructor_id', user.id);

        if (error) throw error;
        
        setEnrolledCourses(data || []);
      } else if (role === 'admin') {
        // Admins see all courses
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            profiles (
              email
            )
          `);

        if (error) throw error;
        
        setEnrolledCourses(data || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert([{ student_id: user.id, course_id: courseId }]);

      if (error) throw error;

      // Refresh the course lists
      fetchCourses();
      alert('Berhasil mendaftar ke kursus!');
    } catch (error) {
      console.error('Error enrolling in course:', error.message);
      alert('Error mendaftar ke kursus: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-sm">
          <div className="w-12 h-12 rounded-full bg-surface-dim"></div>
          <div className="h-4 w-48 bg-surface-dim rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-xl">
        <h1 className="text-headline-sm md:text-headline-md font-bold text-on-surface flex items-center gap-sm">
          <BookOpen className="w-7 h-7 text-primary" />
          Manajemen Pendaftaran Kursus
        </h1>
        <p className="text-body-md text-on-surface-variant mt-xs">Daftar dan kelola kursus Anda</p>
      </div>

      {role === 'murid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
          {/* Available Courses */}
          <div className="bg-surface rounded-2xl border border-outline-variant p-4 md:p-6 shadow-sm">
            <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-sm mb-md">
              <PlusCircle className="w-5 h-5 text-primary" />
              Kursus Tersedia
            </h2>
            {availableCourses.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {availableCourses.map(course => (
                  <div key={course.id} className="bg-surface-dim/30 rounded-xl border border-outline-variant hover:border-primary/30 hover:shadow-sm transition-all duration-300 p-4">
                    <h3 className="text-title-sm font-semibold text-on-surface mb-1">{course.title}</h3>
                    <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-3">{course.description}</p>
                    <div className="text-label-xs text-on-surface-variant mb-3">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {course.profiles?.email || 'Tidak diketahui'}</span>
                      <span className="flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" /> {new Date(course.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <button onClick={() => handleEnroll(course.id)} 
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 text-label-sm font-medium shadow-sm">
                      <ArrowRight className="w-3.5 h-3.5" />
                      Daftar Kursus
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-body-sm text-on-surface-variant">Tidak ada kursus tersedia untuk didaftarkan.</p>
              </div>
            )}
          </div>

          {/* Enrolled Courses */}
          <div className="bg-surface rounded-2xl border border-outline-variant p-4 md:p-6 shadow-sm">
            <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-sm mb-md">
              <BookmarkCheck className="w-5 h-5 text-primary" />
              Kursus Saya
            </h2>
            {enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {enrolledCourses.map(course => (
                  <div key={course.id} className="bg-surface-dim/30 rounded-xl border border-outline-variant p-4">
                    <h3 className="text-title-sm font-semibold text-on-surface mb-1">{course.title}</h3>
                    <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-3">{course.description}</p>
                    <div className="text-label-xs text-on-surface-variant mb-3">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {course.profiles?.email || 'Tidak diketahui'}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-success-container/50 text-on-success-container text-label-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Sudah Terdaftar
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-body-sm text-on-surface-variant">Anda belum terdaftar di kursus mana pun.</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {(role === 'guru' || role === 'admin') && (
        <div className="bg-surface rounded-2xl border border-outline-variant p-4 md:p-6 shadow-sm">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-sm mb-md">
            <BookOpen className="w-5 h-5 text-primary" />
            Kursus Saya
          </h2>
          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledCourses.map(course => (
                <div key={course.id} className="bg-surface-dim/30 rounded-xl border border-outline-variant hover:border-primary/30 hover:shadow-sm transition-all duration-300 p-4">
                  <h3 className="text-title-sm font-semibold text-on-surface mb-1">{course.title}</h3>
                  <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-3">{course.description}</p>
                  <div className="text-label-xs text-on-surface-variant">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {course.profiles?.email || 'Tidak diketahui'}</span>
                    <span className="flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" /> Dibuat: {new Date(course.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-body-sm text-on-surface-variant">{role === 'guru' ? 'Anda belum membuat kursus mana pun.' : 'Tidak ada kursus.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnrollmentModule;