import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

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
    return <div className="dashboard-container">Memuat kursus...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Manajemen Pendaftaran Kursus</h1>
      
      {role === 'murid' && (
        <>
          <div className="dashboard-content">
            <section className="dashboard-section">
              <h2>Kursus Tersedia</h2>
              {availableCourses.length > 0 ? (
                <div className="cards-grid">
                  {availableCourses.map(course => (
                    <div key={course.id} className="card">
                      <div className="card-content">
                        <h3>{course.title}</h3>
                        <p>{course.description}</p>
                        <small>
                          Pengajar: {course.profiles?.email || 'Tidak diketahui'}<br/>
                          Dibuat: {new Date(course.created_at).toLocaleDateString()}
                        </small>
                        <div className="card-actions">
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleEnroll(course.id)}
                          >
                            Daftar Kursus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Tidak ada kursus tersedia untuk didaftarkan.</p>
              )}
            </section>
          </div>
          
          <div className="dashboard-content">
            <section className="dashboard-section">
              <h2>Kursus Saya</h2>
              {enrolledCourses.length > 0 ? (
                <div className="cards-grid">
                  {enrolledCourses.map(course => (
                    <div key={course.id} className="card">
                      <div className="card-content">
                        <h3>{course.title}</h3>
                        <p>{course.description}</p>
                        <small>
                          Pengajar: {course.profiles?.email || 'Tidak diketahui'}<br/>
                          Didaftrkan: {new Date().toLocaleDateString()}
                        </small>
                        <div className="card-actions">
                          <button className="btn btn-secondary" disabled>
                            Sudah Terdaftar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Anda belum terdaftar di kursus mana pun.</p>
              )}
            </section>
          </div>
        </>
      )}
      
      {(role === 'guru' || role === 'admin') && (
        <div className="dashboard-content">
          <section className="dashboard-section">
            <h2>Kursus Saya</h2>
            {enrolledCourses.length > 0 ? (
              <div className="cards-grid">
                {enrolledCourses.map(course => (
                  <div key={course.id} className="card">
                    <div className="card-content">
                      <h3>{course.title}</h3>
                      <p>{course.description}</p>
                      <small>
                        Pengajar: {course.profiles?.email || 'Tidak diketahui'}<br/>
                        Dibuat: {new Date(course.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>{role === 'guru' ? 'Anda belum membuat kursus mana pun.' : 'Tidak ada kursus.'}</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default EnrollmentModule;