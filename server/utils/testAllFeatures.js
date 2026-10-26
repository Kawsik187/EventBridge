import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api';

const request = async (endpoint, method = 'GET', body = null, token = null) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
};

const runAllTests = async () => {
  console.log('====================================================');
  console.log(' STARTING EVENTBRIDGE COMPREHENSIVE FEATURE AUDIT   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, extra = '') => {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${extra}`);
      failed++;
    }
  };

  try {
    const timestamp = Date.now();
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@campus.edu';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminSecurePassword2026!';
    const allowedDomain = process.env.ALLOWED_COLLEGE_EMAIL_DOMAIN || 'srmeaswari.ac.in';

    // 1. Health check
    const health = await request('/health');
    assert(health.status === 200 && health.data?.status === 'ok', 'Health Check endpoint returns 200 OK');

    // 2. Fetch Departments & select CSE
    const deptsRes = await request('/departments');
    assert(deptsRes.status === 200 && Array.isArray(deptsRes.data) && deptsRes.data.length >= 15, '15 Academic Departments seeded and accessible');
    const cseDept = deptsRes.data.find((d) => d.code === 'CSE') || deptsRes.data[0];

    // 3. Admin Authentication
    const adminLogin = await request('/auth/login', 'POST', {
      email: adminEmail,
      password: adminPassword,
    });
    assert(adminLogin.status === 200 && adminLogin.data?.token, `Admin Login (${adminEmail})`);
    const adminToken = adminLogin.data?.token;

    // 4. Student Participant Authentication via Google OAuth
    const studentGoogleRes = await request('/auth/google', 'POST', {
      email: `student.${timestamp}@${allowedDomain}`,
      name: 'Priya Student',
      googleId: `gid_student_${timestamp}`,
    });
    assert(studentGoogleRes.status === 200 && studentGoogleRes.data?.token, 'Student Authentication via Google OAuth');
    const studentToken = studentGoogleRes.data?.token;
    const studentUser = studentGoogleRes.data;

    // 5. Organizer Access Request & Admin Approval
    const orgEmail = `faculty.organizer.${timestamp}@${allowedDomain}`;
    const orgReq = await request('/auth/request-organizer', 'POST', {
      name: 'Dr. Anita Faculty Organizer',
      email: orgEmail,
      password: 'StrongFacultyPassword2026!',
      departmentId: cseDept._id,
      phone: '9876543210',
      collegeId: 'EMP-FAC-01',
    });
    assert(orgReq.status === 201 && orgReq.data?.request?.status === 'PENDING', 'Organizer submits access request for official department');
    const orgReqId = orgReq.data?.request?._id;

    // Admin approves organizer request (handles replacement if needed)
    const approveRes = await request(`/admin/organizer-requests/${orgReqId}/approve`, 'POST', { replaceCurrent: true }, adminToken);
    assert(approveRes.status === 200, 'Admin approves organizer request');

    // Organizer Login
    const organizerLogin = await request('/auth/login', 'POST', {
      email: orgEmail,
      password: 'StrongFacultyPassword2026!',
    });
    assert(organizerLogin.status === 200 && organizerLogin.data?.token && organizerLogin.data?.role === 'organizer', 'Approved Organizer Login');
    const organizerToken = organizerLogin.data?.token;

    // 6. Venues List
    const venuesRes = await request('/venues');
    assert(venuesRes.status === 200 && Array.isArray(venuesRes.data) && venuesRes.data.length > 0, 'Fetch Campus Venues list');
    const testVenue = venuesRes.data[0];

    // 7. Organizer Analytics (Verify NO 403 Forbidden)
    const organizerAnalytics = await request('/events/analytics/organizer', 'GET', null, organizerToken);
    assert(
      organizerAnalytics.status === 200 && organizerAnalytics.data?.summary?.totalEvents !== undefined,
      'Organizer Analytics endpoint accessible to organizer (NO 403 Forbidden)',
      JSON.stringify(organizerAnalytics.data)
    );

    // 8. Admin Analytics
    const adminAnalytics = await request('/admin/analytics', 'GET', null, adminToken);
    assert(adminAnalytics.status === 200 && adminAnalytics.data?.summary?.totalUsers !== undefined, 'Admin Analytics endpoint accessible to admin');

    // 9. Venue Conflict Detection
    const conflictCheck = await request(`/venues/check-availability?venueId=${testVenue._id}&date=2026-09-30&startTime=17:30&endTime=22:00`);
    assert(conflictCheck.status === 200, 'Venue Conflict Check executes correctly');

    // 10. Organizer creates new Event (department automatically bound)
    const newEventRes = await request('/events', 'POST', {
      title: `Cloud Summit ${timestamp}`,
      category: 'Technical',
      description: 'End-to-end verification event created during feature audit.',
      venueId: testVenue._id,
      date: '2026-11-20',
      startTime: '10:00',
      endTime: '16:00',
      registrationDeadline: '2026-11-19',
      maxParticipants: 50,
      eligibility: 'All students',
      rules: ['Follow lab guidelines'],
      customFields: [{ label: 'GitHub Handle', fieldType: 'text', required: true }],
      submitForApproval: true,
    }, organizerToken);
    assert(newEventRes.status === 201 && newEventRes.data?.status === 'pending', 'Organizer creates event with pending approval');
    const createdEventId = newEventRes.data?._id;

    // 11. Organizer fetches their events
    const organizerEvents = await request(`/events?organizerId=${organizerLogin.data._id}&status=`, 'GET', null, organizerToken);
    const foundPending = organizerEvents.data?.some((e) => e._id === createdEventId);
    assert(foundPending, 'Organizer Dashboard correctly sees pending events');

    // 12. Admin Approvals Queue & Approve Event
    const pendingEvents = await request('/admin/events/pending', 'GET', null, adminToken);
    assert(pendingEvents.status === 200 && Array.isArray(pendingEvents.data), 'Admin fetches pending events queue');

    const approveEventRes = await request(`/admin/events/${createdEventId}/approve`, 'POST', null, adminToken);
    assert(approveEventRes.status === 200 && approveEventRes.data?.event?.status === 'approved', 'Admin approves pending event');

    // 13. Organizer Publishes Event
    const publishRes = await request(`/events/${createdEventId}/publish`, 'POST', null, organizerToken);
    assert(publishRes.status === 200 && publishRes.data?.status === 'open', 'Organizer publishes approved event to open status');

    // 14. Student Registers for Event
    const regRes = await request(`/registrations/events/${createdEventId}/register`, 'POST', {
      customResponses: { 'GitHub Handle': 'octocat-student' },
    }, studentToken);
    assert(regRes.status === 201 && regRes.data?.registrationId?.startsWith('REG-'), 'Student successfully registers with custom fields');
    const regCode = regRes.data?.registrationId;

    // 15. Duplicate Registration Prevention
    const dupRegRes = await request(`/registrations/events/${createdEventId}/register`, 'POST', {
      customResponses: { 'GitHub Handle': 'octocat-student' },
    }, studentToken);
    assert(dupRegRes.status === 400 && dupRegRes.data?.message?.includes('already registered'), 'Duplicate registration is strictly blocked');

    // 16. Attendance Check-in with valid registration code
    const checkInRes = await request('/attendance/checkin', 'POST', {
      eventId: createdEventId,
      regCode: regCode,
      method: 'qr_scan',
    }, organizerToken);
    assert(checkInRes.status === 200 && checkInRes.data?.success === true, 'Attendance Desk check-in via QR / registration code');

    // 17. Duplicate Check-in Prevention
    const dupCheckInRes = await request('/attendance/checkin', 'POST', {
      eventId: createdEventId,
      regCode: regCode,
      method: 'manual',
    }, organizerToken);
    assert(dupCheckInRes.status === 400 && dupCheckInRes.data?.alreadyCheckedIn === true, 'Duplicate check-in prevention warning returned');

    // 18. Student Volunteer Application
    const volAppRes = await request('/volunteers/apply', 'POST', {
      eventId: createdEventId,
      preferredRole: 'Technical Support',
      task: 'Setting up audio visual systems',
    }, studentToken);
    assert(volAppRes.status === 201 && volAppRes.data?.status === 'applied', 'Student applies as volunteer');

    // 19. Second student as assigned Volunteer
    const rahulEmail = `rahul.vol.${timestamp}@${allowedDomain}`;
    const rahulGoogle = await request('/auth/google', 'POST', {
      email: rahulEmail,
      name: 'Rahul Volunteer',
      googleId: `gid_rahul_${timestamp}`,
    });
    const rahulToken = rahulGoogle.data?.token;

    const volAssignRes = await request(`/volunteers/events/${createdEventId}/volunteers`, 'POST', {
      eventId: createdEventId,
      userEmail: rahulEmail,
      roleName: 'Registration Desk',
      task: 'Attendee wristband distribution',
    }, organizerToken);
    assert(volAssignRes.status === 201 && volAssignRes.data?.status === 'assigned', 'Organizer assigns student as volunteer');

    // 20. Volunteer event access permissions
    const rahulStaffEvents = await request(`/events?staffUserId=${rahulGoogle.data._id}`, 'GET', null, rahulToken);
    const assignedVolEvent = rahulStaffEvents.data?.find((e) => e._id === createdEventId);
    assert(
      assignedVolEvent && assignedVolEvent.isVolunteer === true && assignedVolEvent.volunteerInfo?.roleName === 'Registration Desk',
      'Assigned volunteer successfully retrieves event with duty info'
    );

    // 21. Volunteer accesses event Attendance Roster
    const volAttendanceRes = await request(`/attendance/events/${createdEventId}/attendance`, 'GET', null, rahulToken);
    assert(volAttendanceRes.status === 200 && Array.isArray(volAttendanceRes.data?.registrations), 'Volunteer accesses event Attendance Roster (200 OK)');

    // 22. Unassigned student is strictly DENIED access to attendance desk (403 Forbidden)
    const unauthorizedStudentRes = await request(`/attendance/events/${createdEventId}/attendance`, 'GET', null, studentToken);
    assert(unauthorizedStudentRes.status === 403, 'Unassigned student is denied attendance desk access (403 Forbidden)');

    // 23. Organizer posts Announcement
    const annRes = await request('/announcements', 'POST', {
      eventId: createdEventId,
      title: 'Lab Room Venue Directions',
      message: 'Take elevator to 2nd floor and turn right to enter the lab room.',
      audience: 'all_registered',
    }, organizerToken);
    assert(annRes.status === 201 && annRes.data?.title === 'Lab Room Venue Directions', 'Organizer broadcasts announcement to attendees');

    // 24. Student fetches announcements
    const studentAnnRes = await request('/announcements/student', 'GET', null, studentToken);
    assert(
      studentAnnRes.status === 200 && studentAnnRes.data?.some((a) => a.title === 'Lab Room Venue Directions'),
      'Student receives official announcements for their registered events'
    );

    // 25. Organizer Issues Batch Certificates for Checked-in Attendees
    const certGenRes = await request('/certificates/generate', 'POST', {
      eventId: createdEventId,
      certificateType: 'Participation',
    }, organizerToken);
    assert(certGenRes.status === 200 && certGenRes.data?.issuedCount >= 1, 'Organizer issues verified certificates for checked-in attendees');

    // 26. Student fetches their Certificates
    const myCertsRes = await request('/certificates/my-certificates', 'GET', null, studentToken);
    assert(myCertsRes.status === 200 && myCertsRes.data?.length > 0, 'Student retrieves their verified certificate list');

    // 27. Clean up test event
    await request(`/events/${createdEventId}`, 'DELETE', null, organizerToken);
    console.log('  ✓ Cleaned up test event and cascaded related records');

    console.log('\n====================================================');
    console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution exception:', err);
    process.exit(1);
  }
};

runAllTests();
