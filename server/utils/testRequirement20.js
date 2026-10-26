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

const runRequirement20Tests = async () => {
  console.log('\n================================================================');
  console.log(' EVENTBRIDGE REQUIREMENT 20 COMPREHENSIVE VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testNumber, description, details = '') => {
    if (condition) {
      console.log(`  ✓ [TEST ${testNumber}] PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ✗ [TEST ${testNumber}] FAIL: ${description}`);
      if (details) console.error(`      Details: ${typeof details === 'object' ? JSON.stringify(details) : details}`);
      failed++;
    }
  };

  try {
    // Clean test departments before suite runs
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventbridge');
      await mongoose.connection.collection('departments').updateMany(
        { code: { $in: ['CSE', 'ECE', 'MECH'] } },
        { $set: { activeOrganizerId: null } }
      );
      // Clean up previous test events or conflicting events on test dates
      await mongoose.connection.collection('events').deleteMany({
        $or: [
          { title: { $regex: /CSE Annual Tech Symposium|Limited Masterclass|Innovations Hackathon/i } },
          { date: { $in: ['2026-11-25', '2026-11-28'] } }
        ]
      });
      await mongoose.disconnect();
    } catch (e) {
      console.warn('DB cleanup warning:', e.message);
    }

    // 0. Fetch initial departments to use across tests
    const deptsRes = await request('/departments');
    if (!deptsRes.ok || !Array.isArray(deptsRes.data) || deptsRes.data.length < 15) {
      throw new Error(`Failed to load 15 departments: got ${deptsRes.data?.length || 0}`);
    }
    const departments = deptsRes.data;
    const cseDept = departments.find((d) => d.code === 'CSE') || departments[0];
    const eceDept = departments.find((d) => d.code === 'ECE') || departments[1];
    const mechDept = departments.find((d) => d.code === 'MECH') || departments[2];

    const venuesRes = await request('/venues');
    const venueId = venuesRes.data?.[0]?._id;

    const allowedDomain = process.env.ALLOWED_COLLEGE_EMAIL_DOMAIN || 'srmeaswari.ac.in';
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@campus.edu';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminSecurePassword2026!';

    const timestamp = Date.now();

    // -------------------------------------------------------------
    // TEST 1: Google OAuth login
    // -------------------------------------------------------------
    const googleUserPayload = {
      email: `student.test.${timestamp}@srmeaswari.ac.in`,
      name: 'Google Student Participant',
      googleId: `gid_${timestamp}`,
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    };
    const googleAuthRes = await request('/auth/google', 'POST', googleUserPayload);
    assert(
      googleAuthRes.status === 200 &&
        googleAuthRes.data?.token &&
        googleAuthRes.data?.role === 'student' &&
        googleAuthRes.data?.googleId === googleUserPayload.googleId,
      1,
      'Google OAuth login creates student account and returns JWT',
      googleAuthRes.data
    );
    const participantToken = googleAuthRes.data?.token;
    const participantId = googleAuthRes.data?._id;

    // -------------------------------------------------------------
    // TEST 2: Admin authentication
    // -------------------------------------------------------------
    const adminLoginRes = await request('/auth/login', 'POST', {
      email: adminEmail,
      password: adminPassword,
    });
    assert(
      adminLoginRes.status === 200 &&
        adminLoginRes.data?.token &&
        adminLoginRes.data?.role === 'admin',
      2,
      'Admin authentication with INITIAL_ADMIN credentials',
      adminLoginRes.data
    );
    const adminToken = adminLoginRes.data?.token;

    // -------------------------------------------------------------
    // TEST 3: Organizer signup / request
    // -------------------------------------------------------------
    const organizer1Email = `org1.${timestamp}@${allowedDomain}`;
    const orgReq1 = await request('/auth/request-organizer', 'POST', {
      name: 'Dr. Anita CSE Organizer',
      email: organizer1Email,
      password: 'StrongOrganizerPassword2026!',
      departmentId: cseDept._id,
      phone: '9876543210',
      collegeId: 'EMP-CSE-001',
    });
    assert(
      orgReq1.status === 201 &&
        orgReq1.data?.request?.status === 'PENDING',
      3,
      'Organizer signup submits request with PENDING status for official domain',
      orgReq1.data
    );
    const orgReq1Id = orgReq1.data?.request?._id;
    const org1UserId = orgReq1.data?.request?.userId;

    // -------------------------------------------------------------
    // TEST 4: Pending organizer access blocked
    // -------------------------------------------------------------
    const pendingLoginRes = await request('/auth/login', 'POST', {
      email: organizer1Email,
      password: 'StrongOrganizerPassword2026!',
    });
    assert(
      pendingLoginRes.status === 403 &&
        pendingLoginRes.data?.isPendingOrganizer === true,
      4,
      'Pending organizer access is strictly blocked with HTTP 403',
      pendingLoginRes.data
    );

    // -------------------------------------------------------------
    // TEST 5: Admin approval
    // -------------------------------------------------------------
    const approveRes = await request(`/admin/organizer-requests/${orgReq1Id}/approve`, 'POST', {}, adminToken);
    assert(
      approveRes.status === 200 &&
        approveRes.data?.user?.role === 'organizer' &&
        (approveRes.data?.user?.organizerStatus === 'active' || approveRes.data?.user?.organizerStatus === 'approved'),
      5,
      'Admin approves organizer request -> role upgraded to ORGANIZER',
      approveRes.data
    );

    // Login as newly approved organizer
    const org1LoginRes = await request('/auth/login', 'POST', {
      email: organizer1Email,
      password: 'StrongOrganizerPassword2026!',
    });
    assert(
      org1LoginRes.status === 200 && org1LoginRes.data?.token && org1LoginRes.data?.role === 'organizer',
      '5b',
      'Approved organizer can now successfully log in and receive token',
      org1LoginRes.data
    );
    const org1Token = org1LoginRes.data?.token;

    // -------------------------------------------------------------
    // TEST 6: Admin rejection
    // -------------------------------------------------------------
    const organizer2Email = `org2.${timestamp}@${allowedDomain}`;
    const orgReq2 = await request('/auth/request-organizer', 'POST', {
      name: 'Dr. Suresh EEE Candidate',
      email: organizer2Email,
      password: 'StrongOrganizerPassword2026!',
      departmentId: eceDept._id,
      phone: '9876543211',
    });
    const orgReq2Id = orgReq2.data?.request?._id;

    const rejectRes = await request(`/admin/organizer-requests/${orgReq2Id}/reject`, 'POST', {
      reason: 'Incomplete documentation submitted',
    }, adminToken);
    assert(
      rejectRes.status === 200 &&
        rejectRes.data?.request?.status === 'REJECTED',
      6,
      'Admin rejects organizer request with audit reason',
      rejectRes.data
    );

    const rejectedLoginRes = await request('/auth/login', 'POST', {
      email: organizer2Email,
      password: 'StrongOrganizerPassword2026!',
    });
    assert(
      rejectedLoginRes.status === 403 && rejectedLoginRes.data?.isRejectedOrganizer === true,
      '6b',
      'Rejected organizer is blocked with HTTP 403 on login attempt',
      rejectedLoginRes.data
    );

    // -------------------------------------------------------------
    // TEST 7: Duplicate organizer prevention
    // -------------------------------------------------------------
    // CSE already has active organizer org1. Try to approve a new organizer for CSE without replacing.
    const dupOrgEmail = `org.dup.${timestamp}@${allowedDomain}`;
    const orgReqDup = await request('/auth/request-organizer', 'POST', {
      name: 'Dr. Vikram CSE Candidate 2',
      email: dupOrgEmail,
      password: 'StrongOrganizerPassword2026!',
      departmentId: cseDept._id,
      phone: '9876543212',
    });
    const orgReqDupId = orgReqDup.data?.request?._id;
    const orgDupUserId = orgReqDup.data?.request?.userId;

    const dupApproveRes = await request(`/admin/organizer-requests/${orgReqDupId}/approve`, 'POST', {}, adminToken);
    assert(
      (dupApproveRes.status === 400 || dupApproveRes.status === 409) &&
        (dupApproveRes.data?.requiresReplacementConfirmation === true ||
          dupApproveRes.data?.message?.includes('already has an active organizer')),
      7,
      'Duplicate active organizer assignment to CSE is prevented with HTTP 400/409',
      dupApproveRes.data
    );

    // -------------------------------------------------------------
    // TEST 8: Organizer replacement
    // -------------------------------------------------------------
    const replaceRes = await request(`/admin/departments/${cseDept._id}/replace-organizer`, 'POST', {
      newUserId: orgDupUserId,
      reason: 'Annual Department Faculty Rotation',
    }, adminToken);
    assert(
      replaceRes.status === 200 &&
        replaceRes.data?.department?.activeOrganizerId?.toString() === orgDupUserId.toString() &&
        replaceRes.data?.previousOrganizer?.organizerStatus === 'deactivated' &&
        replaceRes.data?.newOrganizer?.organizerStatus === 'active',
      8,
      'Organizer replacement deactivates previous organizer and activates new organizer',
      replaceRes.data
    );

    // Login as replaced organizer (orgDup)
    const orgDupLoginRes = await request('/auth/login', 'POST', {
      email: dupOrgEmail,
      password: 'StrongOrganizerPassword2026!',
    });
    const activeCseToken = orgDupLoginRes.data?.token;

    // -------------------------------------------------------------
    // TEST 9: Organizer event creation (bound to department)
    // -------------------------------------------------------------
    const fakeDeptId = new mongoose.Types.ObjectId();
    const eventCreateRes = await request('/events', 'POST', {
      title: `CSE Annual Tech Symposium ${timestamp}`,
      category: 'Technical',
      description: 'Departmental annual symposium covering AI and cloud computing.',
      venueId: venueId,
      date: '2026-11-25',
      startTime: '09:30',
      endTime: '17:00',
      registrationDeadline: '2026-11-24',
      maxParticipants: 100,
      departmentId: fakeDeptId, // Client provides fake department
      submitForApproval: true,
    }, activeCseToken);

    const returnedDeptId = eventCreateRes.data?.departmentId?._id?.toString() || eventCreateRes.data?.departmentId?.toString();
    assert(
      eventCreateRes.status === 201 &&
        returnedDeptId === cseDept._id.toString() &&
        eventCreateRes.data?.departmentCode === 'CSE',
      9,
      'Organizer creates event - backend enforces departmentId = authenticated department (ignores fake)',
      { expectedDept: cseDept._id, received: returnedDeptId }
    );
    const createdEventId = eventCreateRes.data?._id;

    // Admin approves the event and organizer publishes it
    await request(`/admin/events/${createdEventId}/approve`, 'POST', {}, adminToken);
    await request(`/events/${createdEventId}/publish`, 'POST', {}, activeCseToken);

    // -------------------------------------------------------------
    // TEST 10: Cross-department access returns 403
    // -------------------------------------------------------------
    // Set up an active organizer for MECH department
    const mechOrgEmail = `mech.org.${timestamp}@${allowedDomain}`;
    const mechReq = await request('/auth/request-organizer', 'POST', {
      name: 'Dr. Ramesh MECH Organizer',
      email: mechOrgEmail,
      password: 'StrongOrganizerPassword2026!',
      departmentId: mechDept._id,
      phone: '9876543215',
    });
    await request(`/admin/organizer-requests/${mechReq.data?.request?._id}/approve`, 'POST', {}, adminToken);
    const mechLoginRes = await request('/auth/login', 'POST', {
      email: mechOrgEmail,
      password: 'StrongOrganizerPassword2026!',
    });
    const mechToken = mechLoginRes.data?.token;

    // MECH organizer attempts to edit the CSE event
    const crossEditRes = await request(`/events/${createdEventId}`, 'PUT', {
      title: 'Hacked Title by Other Department',
    }, mechToken);
    assert(
      crossEditRes.status === 403,
      10,
      'Cross-department event update is rejected with HTTP 403 Forbidden',
      crossEditRes.data
    );

    // MECH organizer attempts to delete the CSE event
    const crossDeleteRes = await request(`/events/${createdEventId}`, 'DELETE', {}, mechToken);
    assert(
      crossDeleteRes.status === 403,
      '10b',
      'Cross-department event deletion is rejected with HTTP 403 Forbidden',
      crossDeleteRes.data
    );

    // -------------------------------------------------------------
    // TEST 11: Participant event registration
    // -------------------------------------------------------------
    const regRes = await request(`/registrations/events/${createdEventId}/register`, 'POST', {}, participantToken);
    assert(
      regRes.status === 201 && regRes.data?.registrationId?.startsWith('REG-'),
      11,
      'Participant registers for event and receives unique registration code',
      regRes.data
    );

    // -------------------------------------------------------------
    // TEST 12: Duplicate registration prevention
    // -------------------------------------------------------------
    const dupRegRes = await request(`/registrations/events/${createdEventId}/register`, 'POST', {}, participantToken);
    assert(
      dupRegRes.status === 400 && dupRegRes.data?.message?.includes('already registered'),
      12,
      'Duplicate participant registration is prevented with HTTP 400',
      dupRegRes.data
    );

    // -------------------------------------------------------------
    // TEST 13: Capacity validation
    // -------------------------------------------------------------
    // Create an event with capacity = 1
    const tinyEventRes = await request('/events', 'POST', {
      title: `Limited Masterclass ${timestamp}`,
      category: 'Workshop',
      description: 'Exclusive 1-seat workshop.',
      venueId: venueId,
      date: '2026-11-28',
      startTime: '10:00',
      endTime: '12:00',
      registrationDeadline: '2026-11-27',
      maxParticipants: 1,
      submitForApproval: true,
    }, activeCseToken);
    const tinyEventId = tinyEventRes.data?._id;
    await request(`/admin/events/${tinyEventId}/approve`, 'POST', {}, adminToken);
    await request(`/events/${tinyEventId}/publish`, 'POST', {}, activeCseToken);

    // Participant 1 registers -> fills capacity (1/1)
    await request(`/registrations/events/${tinyEventId}/register`, 'POST', {}, participantToken);

    // Participant 2 attempts to register -> exceeds capacity
    const student2Res = await request('/auth/google', 'POST', {
      email: `student2.${timestamp}@campus.edu`,
      name: 'Second Student',
      googleId: `gid2_${timestamp}`,
    });
    const student2Token = student2Res.data?.token;

    const overCapacityRes = await request(`/registrations/events/${tinyEventId}/register`, 'POST', {}, student2Token);
    assert(
      overCapacityRes.status === 400 &&
        (overCapacityRes.data?.message?.includes('capacity') || overCapacityRes.data?.message?.includes('full')),
      13,
      'Registration beyond max capacity is rejected with HTTP 400 capacity error',
      overCapacityRes.data
    );

    // -------------------------------------------------------------
    // TEST 14: Deactivated organizer access blocked
    // -------------------------------------------------------------
    const deactivatedLoginRes = await request('/auth/login', 'POST', {
      email: organizer1Email,
      password: 'StrongOrganizerPassword2026!',
    });
    assert(
      deactivatedLoginRes.status === 403 &&
        (deactivatedLoginRes.data?.isDeactivatedOrganizer === true ||
          deactivatedLoginRes.data?.message?.includes('deactivated')),
      14,
      'Deactivated organizer is blocked from login with HTTP 403',
      deactivatedLoginRes.data
    );

    // Deactivated organizer token attempting to create event
    const deactivatedActionRes = await request('/events', 'POST', {
      title: 'Should Be Blocked',
      venueId: venueId,
    }, org1Token);
    assert(
      deactivatedActionRes.status === 403,
      '14b',
      'Deactivated organizer token is blocked with HTTP 403 on API action',
      deactivatedActionRes.data
    );

    // -------------------------------------------------------------
    // TEST 15: Participant cannot access admin APIs
    // -------------------------------------------------------------
    const participantAdminDepts = await request('/admin/departments', 'GET', null, participantToken);
    assert(
      participantAdminDepts.status === 403,
      15,
      'Participant cannot access /api/admin/departments (HTTP 403 Forbidden)',
      participantAdminDepts.data
    );

    const participantAdminAnalytics = await request('/admin/analytics', 'GET', null, participantToken);
    assert(
      participantAdminAnalytics.status === 403,
      '15b',
      'Participant cannot access /api/admin/analytics (HTTP 403 Forbidden)',
      participantAdminAnalytics.data
    );

    // Cleanup created test events
    await request(`/events/${createdEventId}`, 'DELETE', {}, activeCseToken);
    await request(`/events/${tinyEventId}`, 'DELETE', {}, activeCseToken);

    console.log('\n================================================================');
    console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error during test execution:', error);
    process.exit(1);
  }
};

runRequirement20Tests();
