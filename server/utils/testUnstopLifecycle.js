import dotenv from 'dotenv';
import mongoose from 'mongoose';
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

const runUnstopLifecycleTests = async () => {
  console.log('====================================================================');
  console.log(' UNSTOP-STYLE LIFECYCLE, DEADLINE & CERTIFICATE VERIFICATION SUITE  ');
  console.log('====================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (details) console.error(`     Details:`, typeof details === 'object' ? JSON.stringify(details) : details);
      failed++;
    }
  };

  try {
    // 0. Pre-test cleanup of any previous test events
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventbridge');
      await mongoose.connection.collection('events').deleteMany({
        title: { $regex: /Closed Deadline Hackathon|September Past Symposium|Unstop Certified Summit/i },
      });
      await mongoose.disconnect();
    } catch (e) {
      console.warn('DB cleanup warning:', e.message);
    }

    const timestamp = Date.now();
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@campus.edu';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminSecurePassword2026!';

    // 1. Log in admin & get departments & venues
    const adminRes = await request('/auth/login', 'POST', { email: adminEmail, password: adminPassword });
    const adminToken = adminRes.data?.token;

    const deptsRes = await request('/departments');
    const cseDept = deptsRes.data.find((d) => d.code === 'CSE') || deptsRes.data[0];

    const venuesRes = await request('/venues');
    const venueId = venuesRes.data[2]?._id || venuesRes.data[0]._id;

    // 2. Set up Organizer & Student
    const orgEmail = `unstop.org.${timestamp}@srmeaswari.ac.in`;
    const orgReq = await request('/auth/request-organizer', 'POST', {
      name: 'Prof. Unstop Coordinator',
      email: orgEmail,
      password: 'CoordinatorPassword2026!',
      departmentId: cseDept._id,
      phone: '9876543299',
    });
    await request(`/admin/organizer-requests/${orgReq.data?.request?._id}/approve`, 'POST', { replaceCurrent: true }, adminToken);
    const orgLogin = await request('/auth/login', 'POST', { email: orgEmail, password: 'CoordinatorPassword2026!' });
    const orgToken = orgLogin.data?.token;

    const studentEmail = `student.unstop.${timestamp}@srmeaswari.ac.in`;
    const studentRes = await request('/auth/google', 'POST', {
      email: studentEmail,
      name: 'Aravind Participant',
      googleId: `gid_unstop_${timestamp}`,
    });
    const studentToken = studentRes.data?.token;

    // ---------------------------------------------------------------------------------
    // TEST 1: Event with Passed Registration Deadline
    // ---------------------------------------------------------------------------------
    // Create an event whose deadline passed yesterday (e.g. 2026-10-10), event date is 2026-12-01
    const deadlinePassedEventRes = await request('/events', 'POST', {
      title: `Closed Deadline Hackathon ${timestamp}`,
      category: 'Technical',
      description: 'Hackathon with closed registration deadline.',
      venueId: venueId,
      date: '2026-12-01',
      startTime: '10:00',
      endTime: '16:00',
      registrationDeadline: '2026-10-10', // In the past!
      maxParticipants: 100,
      submitForApproval: true,
    }, orgToken);
    const deadlineEvtId = deadlinePassedEventRes.data?._id;
    await request(`/admin/events/${deadlineEvtId}/approve`, 'POST', null, adminToken);
    await request(`/events/${deadlineEvtId}/publish`, 'POST', null, orgToken);

    // Fetch this event -> Status should be automatically synchronized to 'closed'
    const fetchedDeadlineEvt = await request(`/events/${deadlineEvtId}`);
    assert(
      fetchedDeadlineEvt.data?.status === 'closed',
      'Event with passed registration deadline is automatically marked as "closed"',
      fetchedDeadlineEvt.data?.status
    );

    // Attempting to register -> Must be rejected with HTTP 400
    const attemptRegDeadline = await request(`/registrations/events/${deadlineEvtId}/register`, 'POST', {}, studentToken);
    assert(
      attemptRegDeadline.status === 400 &&
        attemptRegDeadline.data?.message?.toLowerCase().includes('deadline'),
      'Registration attempt after deadline is strictly blocked with HTTP 400',
      attemptRegDeadline.data
    );

    // ---------------------------------------------------------------------------------
    // TEST 2: Finished / Concluded Event Hidden from Unregistered Students
    // ---------------------------------------------------------------------------------
    // Create an event that already took place in September (past date)
    const finishedEventRes = await request('/events', 'POST', {
      title: `September Past Symposium ${timestamp}`,
      category: 'Academic',
      description: 'Completed campus conference.',
      venueId: venueId,
      date: '2026-09-20', // In the past
      startTime: '09:00',
      endTime: '15:00',
      registrationDeadline: '2026-09-18',
      maxParticipants: 100,
      submitForApproval: true,
    }, orgToken);
    const finishedEvtId = finishedEventRes.data?._id;
    await request(`/admin/events/${finishedEvtId}/approve`, 'POST', null, adminToken);
    await request(`/events/${finishedEvtId}/publish`, 'POST', null, orgToken);

    // Check individual event status
    const fetchedFinished = await request(`/events/${finishedEvtId}`);
    assert(
      fetchedFinished.data?.status === 'completed',
      'Past event whose date/time has passed is automatically marked as "completed"',
      fetchedFinished.data?.status
    );

    // Attempting to register -> Must be rejected with HTTP 400
    const attemptRegFinished = await request(`/registrations/events/${finishedEvtId}/register`, 'POST', {}, studentToken);
    assert(
      attemptRegFinished.status === 400 &&
        (attemptRegFinished.data?.message?.toLowerCase().includes('concluded') ||
         attemptRegFinished.data?.message?.toLowerCase().includes('closed')),
      'Registration attempt for concluded event is rejected with HTTP 400',
      attemptRegFinished.data
    );

    // Student Discover / Public listing -> Finished event must NOT be shown!
    const publicEventsList = await request('/events');
    const containsFinishedEvent = publicEventsList.data?.some((e) => e._id === finishedEvtId);
    assert(
      !containsFinishedEvent,
      'Concluded event is removed from public student discover feed (Unstop business logic)',
      { finishedEvtId, publicCount: publicEventsList.data?.length }
    );

    // ---------------------------------------------------------------------------------
    // TEST 3: Registered Student Access & Certificate Visibility in History
    // ---------------------------------------------------------------------------------
    // Create an active event in the future, student registers, then event completes & cert issued
    const futureCertEventRes = await request('/events', 'POST', {
      title: `Unstop Certified Summit ${timestamp}`,
      category: 'Innovation',
      description: 'Full lifecycle verification event.',
      venueId: venueId,
      date: '2026-12-05',
      startTime: '10:00',
      endTime: '15:00',
      registrationDeadline: '2026-12-04',
      maxParticipants: 100,
      submitForApproval: true,
    }, orgToken);
    const certEvtId = futureCertEventRes.data?._id;
    await request(`/admin/events/${certEvtId}/approve`, 'POST', null, adminToken);
    await request(`/events/${certEvtId}/publish`, 'POST', null, orgToken);

    // Student registers for this event
    const regSuccess = await request(`/registrations/events/${certEvtId}/register`, 'POST', {}, studentToken);
    assert(
      regSuccess.status === 201 && regSuccess.data?.registrationId,
      'Student successfully registers for upcoming event',
      regSuccess.data
    );

    // Check-in student at attendance desk
    const checkInRes = await request('/attendance/check-in', 'POST', {
      eventId: certEvtId,
      regCode: regSuccess.data.registrationId,
    }, orgToken);
    assert(
      checkInRes.status === 200 && checkInRes.data?.success === true,
      'Student attendee checks in at attendance desk',
      checkInRes.data
    );

    // Organizer issues certificates for the event
    const issueCertRes = await request('/certificates/generate', 'POST', {
      eventId: certEvtId,
      certificateType: 'Participation',
    }, orgToken);
    assert(
      issueCertRes.status === 200 && issueCertRes.data?.issuedCount >= 1,
      'Organizer generates official verified certificates for attendees',
      issueCertRes.data
    );

    // Verify student's registration history in My Events includes the certificate!
    const myRegistrationsRes = await request('/registrations/me', 'GET', null, studentToken);
    const registeredCertEvent = myRegistrationsRes.data?.find((r) => r.eventId?._id === certEvtId);
    assert(
      registeredCertEvent &&
        registeredCertEvent.certificate &&
        registeredCertEvent.certificate.certificateId?.startsWith('CERT-') &&
        registeredCertEvent.certificate.certificateType === 'Participation',
      'Registered student receives event with attached verified certificate in My Events (Unstop style)',
      registeredCertEvent?.certificate
    );

    // Verify certificate verification public endpoint
    const certId = registeredCertEvent.certificate.certificateId;
    const verifyRes = await request(`/certificates/verify/${certId}`);
    assert(
      verifyRes.status === 200 && verifyRes.data?.certificateId === certId,
      'Public certificate verification endpoint returns 200 with valid credential',
      verifyRes.data?.certificateId
    );

    // Cleanup test events
    await request(`/events/${deadlineEvtId}`, 'DELETE', null, orgToken);
    await request(`/events/${finishedEvtId}`, 'DELETE', null, orgToken);
    await request(`/events/${certEvtId}`, 'DELETE', null, orgToken);

    console.log('\n====================================================================');
    console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
};

runUnstopLifecycleTests();
