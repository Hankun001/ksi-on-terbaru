import { supabase } from '../lib/supabaseClient';

class RealTimeService {
  constructor() {
    this.channels = new Map();
    this.listeners = new Map();
  }

  // Subscribe to changes in a specific table
  subscribeToTable(table, filters = {}, callback) {
    // Validate callback function
    if (typeof callback !== 'function') {
      console.error(`RealTimeService: Invalid callback for table ${table}`, callback);
      console.trace('RealTimeService: Callback validation failed');
      return null;
    }

    console.log(`RealTimeService: Subscribing to ${table} changes`, filters);

    const channelId = `${table}-changes-${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: this.buildFilter(filters)
        },
        (payload) => {
          try {
            callback(payload);
          } catch (error) {
            console.error(`RealTimeService: Error in callback for ${table}:`, error);
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error(`RealTimeService: Subscription error for ${table}:`, err);
        }
      });

    this.channels.set(channelId, channel);

    return channelId;
  }

  // Build filter string for Supabase
  buildFilter(filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return undefined;
    }
    
    return Object.entries(filters)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}=in.(${value.join(',')})`;
        } else {
          return `${key}=eq.${value}`;
        }
      })
      .join(',');
  }

  // Subscribe to user-specific updates
  subscribeToUserUpdates(userId, callback) {
    return this.subscribeToTable('profiles', { id: userId }, callback);
  }

  // Subscribe to course updates for a specific instructor
  subscribeToCourseUpdates(instructorId, callback) {
    return this.subscribeToTable('courses', { instructor_id: instructorId }, callback);
  }

  // Subscribe to enrollment updates for a specific student
  subscribeToEnrollmentUpdates(studentId, callback) {
    return this.subscribeToTable('enrollments', { student_id: studentId }, callback);
  }

  // Subscribe to assignment updates for courses a student is enrolled in
  subscribeToAssignmentUpdatesForStudent(studentId, courseIds, callback) {
    return this.subscribeToTable('assignments', { course_id: courseIds }, callback);
  }

  // Subscribe to submission updates for a specific student
  subscribeToSubmissionUpdates(studentId, callback) {
    return this.subscribeToTable('submissions', { student_id: studentId }, callback);
  }

  // Subscribe to submission updates for a teacher's assignments
  async subscribeToSubmissionUpdatesForTeacher(teacherId, callback) {
    // First get the teacher's courses
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('instructor_id', teacherId);
    
    if (courseError) {
      console.error('Error fetching teacher courses:', courseError);
      return;
    }

    const courseIds = courses.map(course => course.id);
    if (courseIds.length === 0) {
      return;
    }

    // Then get assignments for those courses
    const { data: assignments, error: assignmentError } = await supabase
      .from('assignments')
      .select('id')
      .in('course_id', courseIds);
    
    if (assignmentError) {
      console.error('Error fetching assignments:', assignmentError);
      return;
    }

    const assignmentIds = assignments.map(assignment => assignment.id);
    if (assignmentIds.length === 0) {
      return;
    }

    return this.subscribeToTable('submissions', { assignment_id: assignmentIds }, callback);
  }

  // Subscribe to progress updates for a specific student
  subscribeToProgressUpdates(studentId, callback) {
    return this.subscribeToTable('student_progress', { student_id: studentId }, callback);
  }

  // Subscribe to announcement updates for courses a user is associated with
  async subscribeToAnnouncementUpdates(userId, role, callback) {
    if (role === 'murid') {
      // Subscribe to announcements for courses the student is enrolled in
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', userId);
      
      if (enrollmentError) {
        console.error('Error fetching student enrollments:', enrollmentError);
        return;
      }

      const courseIds = enrollments.map(enrollment => enrollment.course_id);
      if (courseIds.length > 0) {
        return this.subscribeToTable('announcements', { course_id: courseIds }, callback);
      }
    } else if (role === 'guru') {
      // Subscribe to announcements for courses the teacher teaches
      const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .eq('instructor_id', userId);
      
      if (courseError) {
        console.error('Error fetching teacher courses:', courseError);
        return;
      }

      const courseIds = courses.map(course => course.id);
      if (courseIds.length > 0) {
        return this.subscribeToTable('announcements', { course_id: courseIds }, callback);
      }
    }
  }

  // Subscribe to message updates for a specific user
  subscribeToMessageUpdates(userId, callback) {
    return this.subscribeToTable(
      'messages', 
      { or: `sender_id.eq.${userId},receiver_id.eq.${userId}` }, 
      callback
    );
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelId) {
    const channel = this.channels.get(channelId);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelId);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    for (const [_, channel] of this.channels) {
      supabase.removeChannel(channel);
    }
    this.channels.clear();
  }

  // Check connection status
  getConnectionStatus() {
    // This is a simplified check - in a real implementation, you'd have more sophisticated connection monitoring
    return { connected: true, timestamp: new Date() };
  }

  // Reconnect logic
  async reconnect() {
    try {
      // The Supabase client handles reconnection automatically
      // We just need to resubscribe to channels if needed
      console.log('Real-time service reconnection handled by Supabase client');
    } catch (error) {
      console.error('Error reconnecting to real-time service:', error);
    }
  }
}

// Create singleton instance
const realTimeService = new RealTimeService();

// Export the instance
export default realTimeService;