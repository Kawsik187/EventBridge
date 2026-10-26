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

const runAudit = async () => {
  console.log('\n================================================================');
  console.log(' EVENTBRIDGE CONCURRENCY, SECURITY & CAPACITY VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (details) console.error(`      Details:`, details);
      failed++;
    }
  };

  try {
    const timestamp = Date.now();
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@campus.edu';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminSecurePassword2026!';

    // 1. Health check with honest database status
    const health = await request('/health');
    assert(
      health.status === 200 && health.data?.status === 'ok' && health.data?.database === 'connected',
      'Health check reports 200 OK and database: connected',
      health.data
    );

    // 2. Admin Login
    const adminRes = await request('/auth/login', 'POST', {
      email: adminEmail,
      password: adminPassword,
    });
    assert(adminRes.status === 200 && adminRes.data?.token, 'Admin login succeeds');
    const adminToken = adminRes.data?.token;

    // 3. Create test organizer
    const orgEmail = `org.audit.${timestamp}@srmeaswari.ac.in`;
    const depts = await request('/departments');
    const cseDept = depts.data.find((d) => d.code === 'CSE') || depts.data[0];

    const orgReq = await request('/auth/request-organizer', 'POST', {
      name: 'Audit Faculty Organizer',
      email: orgEmail,
      password: 'StrongOrganizerPassword2026!',
      departmentId: cseDept._id,
      phone: '9876543299',
    });
    await request(`/admin/organizer-requests/${orgReq.data?.request?._id}/approve`, 'POST', { replaceCurrent: true }, adminToken);

    const orgLogin = await request('/auth/login', 'POST', {
      email: orgEmail,
      password: 'StrongOrganizerPassword2026!',
    });
    const organizerToken = orgLogin.data?.token;

    // 4. Fetch venues
    const venues = await request('/venues');
    const venue = venues.data[0]; // e.g. Innovation Lab (capacity 100)

    // 5. Test Invalid Schedule: Start time after End time should return 400
    const invalidTimeRes = await request('/events', 'POST', {
      title: `Invalid Schedule Event ${timestamp}`,
      category: 'Technical',
      description: 'Testing start time after end time',
      venueId: venue._id,
      date: '2026-11-15',
      startTime: '17:00',
      endTime: '10:00',
      registrationDeadline: '2026-11-14',
      maxParticipants: 10,
    }, organizerToken);
    assert(
      invalidTimeRes.status === 400 && invalidTimeRes.data?.message?.includes('Event start time must be strictly before end time'),
      'Backend strictly rejects event where start time is after end time (400 Bad Request)',
      invalidTimeRes.data
    );

    // 6. Test Venue Capacity Violation: Event capacity > Venue capacity should return 400
    const overCapacityRes = await request('/events', 'POST', {
      title: `Over Venue Capacity Event ${timestamp}`,
      category: 'Technical',
      description: 'Testing event capacity exceeding venue capacity',
      venueId: venue._id,
      date: '2026-11-15',
      startTime: '10:00',
      endTime: '12:00',
      registrationDeadline: '2026-11-14',
      maxParticipants: venue.capacity + 500, // Exceeds venue capacity
    }, organizerToken);
    assert(
      overCapacityRes.status === 400 && overCapacityRes.data?.message?.includes('cannot exceed venue capacity'),
      'Backend rejects event whose requested capacity exceeds venue capacity',
      overCapacityRes.data
    );

    // 7. Create limited capacity event for Concurrency Test (capacity = 2)
    const limitedEventRes = await request('/events', 'POST', {
      title: `Concurrency Limited Test ${timestamp}`,
      category: 'Technical',
      description: 'Stress testing atomic capacity and race conditions',
      venueId: venue._id,
      date: '2026-11-16',
      startTime: '14:00',
      endTime: '16:00',
      registrationDeadline: '2026-11-15',
      maxParticipants: 2,
    }, organizerToken);
    const eventId = limitedEventRes.data?._id;
    await request(`/admin/events/${eventId}/approve`, 'POST', {}, adminToken);
    await request(`/events/${eventId}/publish`, 'POST', {}, organizerToken);

    // Create 3 student accounts
    const studentTokens = [];
    for (let i = 1; i <= 3; i++) {
      const sRes = await request('/auth/google', 'POST', {
        email: `student.stress.${i}.${timestamp}@srmeaswari.ac.in`,
        name: `Stress Student ${i}`,
        googleId: `gid_${i}_${timestamp}`,
      });
      studentTokens.push(sRes.data.token);
    }

    // 8. CONCURRENCY TEST: Execute 3 simultaneous registrations for only 2 available slots
    const concurrentResponses = await Promise.all([
      request(`/registrations/events/${eventId}/register`, 'POST', {}, studentTokens[0]),
      request(`/registrations/events/${eventId}/register`, 'POST', {}, studentTokens[1]),
      request(`/registrations/events/${eventId}/register`, 'POST', {}, studentTokens[2]),
    ]);

    const successes = concurrentResponses.filter((r) => r.status === 201);
    const rejected = concurrentResponses.filter((r) => r.status === 400);

    assert(
      successes.length === 2 && rejected.length === 1,
      'Concurrent registrations: Exactly 2 students allocated and 1 rejected when capacity is 2',
      { successes: successes.length, rejected: rejected.length }
    );

    // Verify persisted event registration count is exactly 2
    const verifyEvtRes = await request(`/events/${eventId}`);
    assert(
      verifyEvtRes.data?.currentRegistrations === 2 && verifyEvtRes.data?.status === 'closed',
      'Event currentRegistrations counter remains strictly consistent (2/2) and status transitioned to closed',
      { count: verifyEvtRes.data?.currentRegistrations, status: verifyEvtRes.data?.status }
    );

    // 9. Cancellation & Idempotency Test:
    // Identify which student won the race condition and holds a valid registration
    const registeredStudentIdx = concurrentResponses.findIndex((r) => r.status === 201);
    const registeredStudentToken = studentTokens[registeredStudentIdx];

    // That student cancels registration
    const cancelRes1 = await request(`/registrations/events/${eventId}/register`, 'DELETE', {}, registeredStudentToken);
    assert(cancelRes1.status === 200, 'Student cancels registration successfully');

    // Repeated cancellation by same student must be rejected (idempotent, does not decrement capacity again)
    const cancelResRepeated = await request(`/registrations/events/${eventId}/register`, 'DELETE', {}, registeredStudentToken);
    assert(
      cancelResRepeated.status === 400 && cancelResRepeated.data?.message?.includes('already cancelled'),
      'Repeated cancellation attempt is rejected with HTTP 400 without corrupting capacity',
      cancelResRepeated.data
    );

    const afterCancelEvt = await request(`/events/${eventId}`);
    assert(
      afterCancelEvt.data?.currentRegistrations === 1 && afterCancelEvt.data?.status === 'open',
      'Event counter decrements accurately to 1 and event automatically re-opens for registration',
      { count: afterCancelEvt.data?.currentRegistrations, status: afterCancelEvt.data?.status }
    );

    // 10. Re-registration of previously cancelled student:
    // That student re-registers for the now-open slot
    const reRegisterRes = await request(`/registrations/events/${eventId}/register`, 'POST', {}, registeredStudentToken);
    assert(
      reRegisterRes.status === 201 && reRegisterRes.data?.status === 'registered',
      'Previously cancelled student can re-register seamlessly and receive a valid registration',
      reRegisterRes.data
    );

    // 11. Security Check: Volunteer roster authorization
    // An unauthorized random student cannot query /api/volunteers/events/:id/volunteers
    const unauthorizedVolunteerRes = await request(`/volunteers/events/${eventId}/volunteers`, 'GET', null, studentTokens[2]);
    assert(
      unauthorizedVolunteerRes.status === 403,
      'Unauthorized student is blocked from accessing event volunteer roster (403 Forbidden)',
      unauthorizedVolunteerRes.data
    );

    // Organizer CAN access volunteer roster
    const authorizedVolunteerRes = await request(`/volunteers/events/${eventId}/volunteers`, 'GET', null, organizerToken);
    assert(
      authorizedVolunteerRes.status === 200 && Array.isArray(authorizedVolunteerRes.data),
      'Authorized event organizer can access event volunteer roster',
      authorizedVolunteerRes.data
    );

    // 12. Security & Policy Check: Only Easwari Engineering College students can volunteer
    // Create external student from another college
    const extStudentRes = await request('/auth/register', 'POST', {
      name: 'External College Student',
      email: `other.college.${timestamp}@otheruniv.edu`,
      password: 'ExternalPassword2026!',
      collegeName: 'Other Engineering College',
      department: 'Mechanical',
    });
    const extStudentToken = extStudentRes.data?.token;

    // External student attempts to apply as volunteer -> MUST return 403 Forbidden
    const extVolApplyRes = await request('/volunteers/apply', 'POST', {
      eventId,
      preferredRole: 'Technical Support',
      task: 'Testing volunteer restriction',
    }, extStudentToken);
    assert(
      extVolApplyRes.status === 403 && extVolApplyRes.data?.message?.includes('Easwari Engineering College'),
      'Student from other college is blocked from volunteering (403 Forbidden - Easwari only)',
      extVolApplyRes.data
    );

    // Organizer attempts to assign external student as volunteer -> MUST return 403 Forbidden
    const extVolAssignRes = await request(`/volunteers/events/${eventId}/volunteers`, 'POST', {
      eventId,
      userEmail: `other.college.${timestamp}@otheruniv.edu`,
      roleName: 'Hospitality',
      task: 'Guest hospitality',
    }, organizerToken);
    assert(
      extVolAssignRes.status === 403 && extVolAssignRes.data?.message?.includes('Easwari Engineering College'),
      'Organizer cannot assign student from other college as volunteer (403 Forbidden)',
      extVolAssignRes.data
    );

    // Easwari student applies as volunteer -> MUST SUCCEED with 201 Created
    const easwariVolApplyRes = await request('/volunteers/apply', 'POST', {
      eventId,
      preferredRole: 'Technical Support',
      task: 'Audio checks',
    }, studentTokens[0]);
    assert(
      easwariVolApplyRes.status === 201 && easwariVolApplyRes.data?.status === 'applied',
      'Easwari Engineering College student can apply as volunteer successfully (201 Created)',
      easwariVolApplyRes.data
    );

    // Cleanup test event
    await request(`/events/${eventId}`, 'DELETE', null, adminToken);

    console.log(`\n================================================================`);
    console.log(` AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log(`================================================================\n`);
  } catch (error) {
    console.error('Audit suite error:', error);
  }
};

runAudit();
