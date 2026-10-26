import mongoose from 'mongoose';
import crypto from 'crypto';
import Event from '../models/Event.js';
import Team from '../models/Team.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';
import { isTransactionSupported } from '../utils/dbHelper.js';

const generateInviteCode = () => {
  return `EB-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

/**
 * @route   POST /api/events/:eventId/teams
 * @desc    Create a new team & become the Team Leader
 * @access  Private (Participant)
 */
export const createTeam = async (req, res) => {
  let session = null;
  let hasActiveTransaction = false;

  if (isTransactionSupported()) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      hasActiveTransaction = true;
    } catch (err) {
      session = null;
      hasActiveTransaction = false;
    }
  }

  const sessionOption = hasActiveTransaction && session ? { session } : {};

  try {
    const { eventId } = req.params;
    const { teamName } = req.body;
    const userId = req.user._id;

    if (!teamName || teamName.trim().length < 3) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({ success: false, message: 'Team name must be at least 3 characters' });
    }

    const event = hasActiveTransaction ? await Event.findById(eventId).session(session) : await Event.findById(eventId);
    if (!event) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // 1. Check Event Status and Registration Deadline
    const now = new Date();
    const validStatuses = ['published', 'active', 'open', 'approved'];
    if (!validStatuses.includes(event.status)) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({ success: false, message: 'Event is not accepting registrations' });
    }

    if (event.registrationEndDate && now > new Date(event.registrationEndDate)) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    // 2. Validate Participation Format
    if (event.registrationType === 'individual_only') {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({ success: false, message: 'This event only accepts individual registrations' });
    }

    // 2b. Check Event Participant Capacity
    if (event.maxParticipants && (event.currentRegistrations || 0) >= event.maxParticipants) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({ success: false, message: 'Event participant capacity has been reached' });
    }

    // 3. Multi-Tenant Eligibility Check (Cross-College Verification)
    const user = hasActiveTransaction ? await User.findById(userId).session(session) : await User.findById(userId);
    const userUniversity = (user.collegeName || user.academicProfile?.universityName || '').trim().toLowerCase();

    if (event.eligibilityType === 'college_restricted' && event.allowedUniversities?.length > 0) {
      const allowed = event.allowedUniversities.map((u) => u.trim().toLowerCase());
      if (!userUniversity || !allowed.includes(userUniversity)) {
        if (hasActiveTransaction) {
          await session.abortTransaction();
          session.endSession();
        }
        return res.status(403).json({
          success: false,
          message: 'Access Restricted: This event is reserved exclusively for students of the host university',
        });
      }
    }

    // 4. Duplicate Check: Ensure user is not already registered or in another team for this event
    const existingRegistration = await Registration.findOne({
      eventId,
      studentId: userId,
    });

    if (existingRegistration) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(409).json({ success: false, message: 'You are already registered for this event' });
    }

    // 5. Generate collision-resistant invite code
    let inviteCode = generateInviteCode();
    let codeExists = await Team.findOne({ inviteCode });
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await Team.findOne({ inviteCode });
    }

    // 6. Create Team Record
    const userCollege = user.collegeName || user.academicProfile?.universityName || 'Independent';
    const userDept = user.department || 'General';
    const userYear = user.yearOfStudy || user.year || '1st Year';

    const newTeam = new Team({
      name: teamName.trim(),
      eventId,
      leaderId: userId,
      inviteCode,
      members: [
        {
          userId,
          role: 'leader',
          collegeName: userCollege,
          universityName: userCollege,
          department: userDept,
          yearOfStudy: userYear,
          joinedAt: now,
        },
      ],
      isCrossCollege: false,
      currentRoundNumber: 1,
      status: event.minTeamSize <= 1 ? 'complete' : 'forming',
    });
    await newTeam.save(sessionOption);

    // 7. Register Leader
    const registrationId = `REG-${eventId.toString().slice(-4).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const newRegistration = new Registration({
      eventId,
      studentId: userId,
      participantId: userId,
      teamId: newTeam._id,
      registrationType: 'team',
      registrationId,
      ticketNumber: registrationId,
      status: 'confirmed',
      qrCodeDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${registrationId}`,
    });
    await newRegistration.save(sessionOption);

    // 8. Increment Counter
    await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistrations: 1, currentRegistrationsCount: 1 } }, sessionOption);

    if (hasActiveTransaction) {
      await session.commitTransaction();
      session.endSession();
    }

    return res.status(201).json({
      success: true,
      message: 'Team successfully created! Share the invite code with your teammates.',
      data: {
        team: newTeam,
        inviteCode: newTeam.inviteCode,
        inviteUrl: `/teams/join/${newTeam.inviteCode}`,
      },
    });
  } catch (error) {
    if (hasActiveTransaction && session) {
      await session.abortTransaction();
      session.endSession();
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/teams/join
 * @desc    Join an existing team using invite code
 * @access  Private (Participant)
 */
export const joinTeamByCode = async (req, res) => {
  let session = null;
  let hasActiveTransaction = false;

  if (isTransactionSupported()) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      hasActiveTransaction = true;
    } catch (err) {
      session = null;
      hasActiveTransaction = false;
    }
  }

  const sessionOption = hasActiveTransaction && session ? { session } : {};

  try {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    if (!inviteCode) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    const team = hasActiveTransaction
      ? await Team.findOne({ inviteCode: cleanCode }).session(session)
      : await Team.findOne({ inviteCode: cleanCode });

    if (!team) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(404).json({ success: false, message: 'Invalid team invite code' });
    }

    const event = hasActiveTransaction
      ? await Event.findById(team.eventId).session(session)
      : await Event.findById(team.eventId);

    if (!event) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(404).json({ success: false, message: 'Associated event no longer exists' });
    }

    // 1. Deadline & Capacity Validation
    if (event.registrationEndDate && new Date() > new Date(event.registrationEndDate)) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({ success: false, message: 'Registrations for this event have closed' });
    }

    if (event.maxParticipants && (event.currentRegistrations || 0) >= event.maxParticipants) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({ success: false, message: 'Event participant capacity has been reached' });
    }

    // 2. Eligibility & Cross-College Rules Check
    const user = hasActiveTransaction
      ? await User.findById(userId).session(session)
      : await User.findById(userId);

    const userUniversity = (user.collegeName || user.academicProfile?.universityName || '').trim().toLowerCase();

    if (event.eligibilityType === 'college_restricted' && event.allowedUniversities?.length > 0) {
      const allowed = event.allowedUniversities.map((u) => u.trim().toLowerCase());
      if (!userUniversity || !allowed.includes(userUniversity)) {
        if (hasActiveTransaction) {
          await session.abortTransaction();
          session.endSession();
        }
        return res.status(403).json({
          success: false,
          message: 'Access Restricted: You belong to an institution not permitted to enter this event',
        });
      }
    }

    // Check Cross-College team policy
    const leaderMember = team.members.find((m) => m.role === 'leader');
    const leaderCollege = (leaderMember?.collegeName || leaderMember?.universityName || '').trim().toLowerCase();
    const isDifferentCollege = leaderCollege && userUniversity && leaderCollege !== userUniversity;

    if (isDifferentCollege && event.allowCrossCollegeTeams === false) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(403).json({
        success: false,
        message: 'This event strictly prohibits cross-college teams. All members must belong to the host institution.',
      });
    }

    // 3. User already registered check
    const existingRegistration = await Registration.findOne({
      eventId: event._id,
      studentId: userId,
    });

    if (existingRegistration) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(409).json({ success: false, message: 'You have already registered for this event in another roster' });
    }

    // 4. ATOMIC CONCURRENCY-SAFE UPDATE
    const candidateCollege = user.collegeName || user.academicProfile?.universityName || 'Independent';
    const candidateDept = user.department || 'General';
    const candidateYear = user.yearOfStudy || user.year || '1st Year';

    const updatedTeam = await Team.findOneAndUpdate(
      {
        _id: team._id,
        'members.userId': { $ne: userId },
        $expr: { $lt: [{ $size: '$members' }, event.maxTeamSize || 4] },
      },
      {
        $push: {
          members: {
            userId,
            role: 'member',
            collegeName: candidateCollege,
            universityName: candidateCollege,
            department: candidateDept,
            yearOfStudy: candidateYear,
            joinedAt: new Date(),
          },
        },
        $set: {
          isCrossCollege: team.isCrossCollege || isDifferentCollege,
        },
      },
      { new: true, ...sessionOption }
    );

    if (!updatedTeam) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({
        success: false,
        message: 'Unable to join team: Team is full, or you are already an active member.',
      });
    }

    // 5. Update team readiness state if minimum team size is satisfied
    if (updatedTeam.members.length >= (event.minTeamSize || 1)) {
      updatedTeam.status = 'complete';
      await updatedTeam.save(sessionOption);
    }

    // 6. Create participant registration
    const registrationId = `REG-${event._id.toString().slice(-4).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const newRegistration = new Registration({
      eventId: event._id,
      studentId: userId,
      participantId: userId,
      teamId: team._id,
      registrationType: 'team',
      registrationId,
      ticketNumber: registrationId,
      status: 'confirmed',
      qrCodeDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${registrationId}`,
    });
    await newRegistration.save(sessionOption);

    await Event.findByIdAndUpdate(event._id, { $inc: { currentRegistrations: 1, currentRegistrationsCount: 1 } }, sessionOption);

    if (hasActiveTransaction) {
      await session.commitTransaction();
      session.endSession();
    }

    return res.status(200).json({
      success: true,
      message: `Successfully joined ${updatedTeam.name}!`,
      data: {
        team: updatedTeam,
        eventId: event._id,
        ticket: newRegistration,
      },
    });
  } catch (error) {
    if (hasActiveTransaction && session) {
      await session.abortTransaction();
      session.endSession();
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/teams/details/:inviteCode
 * @desc    Get team preview by invite code (for join page)
 * @access  Public / Private
 */
export const getTeamByInviteCode = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const team = await Team.findOne({ inviteCode: inviteCode.trim().toUpperCase() })
      .populate('eventId', 'title slug category bannerUrl format minTeamSize maxTeamSize registrationEndDate eligibilityType allowedUniversities')
      .populate('members.userId', 'name avatar academicProfile');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found with this code' });
    }

    return res.status(200).json({ success: true, data: team });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/teams/my
 * @desc    Get all teams for logged in user
 * @access  Private
 */
export const getMyTeams = async (req, res) => {
  try {
    const userId = req.user._id;
    const teams = await Team.find({ 'members.userId': userId })
      .populate('eventId', 'title slug category bannerUrl status currentRoundNumber rounds')
      .populate('members.userId', 'name email avatar academicProfile');

    return res.status(200).json({ success: true, data: teams });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/teams/events/:eventId/roster
 * @desc    Cross-College Query: Fetch an event's attendee roster & demographic breakdown
 * @access  Private (Host, Organizer, Admin)
 */
export const getEventAttendeeRoster = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 20, search = '', filterCollege = '' } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const targetEventId = new mongoose.Types.ObjectId(eventId);

    const pipeline = [
      // 1. Match registrations for event
      {
        $match: {
          eventId: targetEventId,
          status: { $in: ['confirmed', 'registered', 'checked_in'] },
        },
      },
      // 2. Lookup Participant / Student details
      {
        $lookup: {
          from: 'users',
          let: { studentId: '$studentId', participantId: '$participantId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$_id', '$$participantId'] },
                    { $eq: ['$_id', '$$studentId'] },
                  ],
                },
              },
            },
          ],
          as: 'participant',
        },
      },
      {
        $unwind: {
          path: '$participant',
          preserveNullAndEmptyArrays: true,
        },
      },
      // 3. Lookup Team details if team registration
      {
        $lookup: {
          from: 'teams',
          localField: 'teamId',
          foreignField: '_id',
          as: 'team',
        },
      },
      {
        $unwind: {
          path: '$team',
          preserveNullAndEmptyArrays: true,
        },
      },
      // 4. Search and College Filters
      ...(search || filterCollege
        ? [
            {
              $match: {
                $and: [
                  search
                    ? {
                        $or: [
                          { 'participant.name': { $regex: search, $options: 'i' } },
                          { 'participant.email': { $regex: search, $options: 'i' } },
                          { registrationId: { $regex: search, $options: 'i' } },
                          { ticketNumber: { $regex: search, $options: 'i' } },
                          { 'team.name': { $regex: search, $options: 'i' } },
                        ],
                      }
                    : {},
                  filterCollege
                    ? {
                        $or: [
                          { 'participant.collegeName': { $regex: filterCollege, $options: 'i' } },
                          { 'participant.academicProfile.universityName': { $regex: filterCollege, $options: 'i' } },
                        ],
                      }
                    : {},
                ],
              },
            },
          ]
        : []),
      // 5. Faceted Aggregation: Roster + Demographics
      {
        $facet: {
          roster: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit, 10) },
            {
              $project: {
                _id: 1,
                registrationId: { $ifNull: ['$registrationId', '$ticketNumber'] },
                ticketNumber: { $ifNull: ['$ticketNumber', '$registrationId'] },
                registrationType: 1,
                status: 1,
                checkInStatus: 1,
                registeredAt: { $ifNull: ['$registeredAt', '$createdAt'] },
                participant: {
                  _id: '$participant._id',
                  name: '$participant.name',
                  email: '$participant.email',
                  avatar: '$participant.avatar',
                  collegeName: {
                    $ifNull: ['$participant.collegeName', '$participant.academicProfile.universityName', 'Independent'],
                  },
                  department: '$participant.department',
                  yearOfStudy: { $ifNull: ['$participant.yearOfStudy', '$participant.year', '1st Year'] },
                  portfolioUsername: '$participant.portfolio.username',
                },
                team: {
                  _id: '$team._id',
                  name: '$team.name',
                  inviteCode: '$team.inviteCode',
                  isCrossCollege: '$team.isCrossCollege',
                  totalMembers: { $size: { $ifNull: ['$team.members', []] } },
                },
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
          collegeDistribution: [
            {
              $group: {
                _id: {
                  $ifNull: ['$participant.collegeName', '$participant.academicProfile.universityName', 'Independent'],
                },
                totalRegistrations: { $sum: 1 },
              },
            },
            { $sort: { totalRegistrations: -1 } },
            { $limit: 10 },
          ],
          departmentDistribution: [
            {
              $group: {
                _id: { $ifNull: ['$participant.department', 'General'] },
                totalRegistrations: { $sum: 1 },
              },
            },
            { $sort: { totalRegistrations: -1 } },
            { $limit: 8 },
          ],
        },
      },
    ];

    const [result] = await Registration.aggregate(pipeline);
    const total = result.totalCount[0]?.count || 0;

    return res.status(200).json({
      success: true,
      data: {
        roster: result.roster,
        pagination: {
          totalRecords: total,
          currentPage: parseInt(page, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
        },
        analytics: {
          collegeDistribution: result.collegeDistribution,
          departmentDistribution: result.departmentDistribution,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
