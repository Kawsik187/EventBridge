import Submission from '../models/Submission.js';
import Event from '../models/Event.js';
import Team from '../models/Team.js';

/**
 * @route   POST /api/events/:eventId/rounds/:roundNumber/submissions
 * @desc    Submit project deliverable for a specific hackathon round
 * @access  Private (Participant)
 */
export const submitRoundDeliverable = async (req, res) => {
  try {
    const { eventId, roundNumber } = req.params;
    const { title, abstract, fileUrl, fileType, githubRepoUrl, liveDemoUrl, additionalNotes } = req.body;
    const userId = req.user._id;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Project title is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const currentRoundNum = parseInt(roundNumber, 10);
    const roundConfig = event.rounds?.find((r) => r.roundNumber === currentRoundNum);
    if (!roundConfig) {
      return res.status(404).json({ success: false, message: `Round ${roundNumber} configuration not found` });
    }

    // Check submission deadline
    if (roundConfig.submissionDeadline && new Date() > new Date(roundConfig.submissionDeadline)) {
      return res.status(400).json({ success: false, message: 'Submission deadline for this round has expired' });
    }

    // Check team or individual registration
    let team = await Team.findOne({ eventId, 'members.userId': userId });

    if (team) {
      if (team.isEliminated) {
        return res.status(403).json({ success: false, message: 'Your team has been eliminated from this competition' });
      }
      if (team.currentRoundNumber < currentRoundNum) {
        return res.status(403).json({
          success: false,
          message: `Your team has not advanced to Round ${currentRoundNum} yet (Current: Round ${team.currentRoundNumber})`,
        });
      }
    }

    // Upsert submission for this team/user & round
    const query = {
      eventId,
      roundNumber: currentRoundNum,
      ...(team ? { teamId: team._id } : { userId }),
    };

    const updateData = {
      eventId,
      roundNumber: currentRoundNum,
      teamId: team ? team._id : null,
      userId,
      submissionData: {
        title: title.trim(),
        abstract: abstract || '',
        fileUrl: fileUrl || '',
        fileType: fileType || '',
        githubRepoUrl: githubRepoUrl || '',
        liveDemoUrl: liveDemoUrl || '',
        additionalNotes: additionalNotes || '',
      },
      verdict: 'pending',
    };

    const submission = await Submission.findOneAndUpdate(query, updateData, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Deliverable submitted successfully!',
      data: submission,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/events/:eventId/rounds/:roundNumber/submissions
 * @desc    Get submissions for a round (Organizer / Evaluator view)
 * @access  Private (Org Admin, Evaluator, Admin)
 */
export const getRoundSubmissions = async (req, res) => {
  try {
    const { eventId, roundNumber } = req.params;
    const { verdict } = req.query;

    const query = {
      eventId,
      roundNumber: parseInt(roundNumber, 10),
    };

    if (verdict) {
      query.verdict = verdict;
    }

    const submissions = await Submission.find(query)
      .populate('teamId', 'name members inviteCode isEliminated')
      .populate('userId', 'name email avatar academicProfile')
      .populate('evaluations.evaluatorId', 'name email')
      .sort({ averageScore: -1, createdAt: -1 });

    return res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/submissions/:submissionId/evaluate
 * @desc    Score a submission with rubric criteria
 * @access  Private (Evaluator, Org Admin, Admin)
 */
export const evaluateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { rubricScores, feedback, verdict } = req.body;
    const evaluatorId = req.user._id;

    if (!Array.isArray(rubricScores) || rubricScores.length === 0) {
      return res.status(400).json({ success: false, message: 'Rubric scores array is required' });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const totalScore = rubricScores.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);

    // Remove existing evaluation from this evaluator if any, then push new one
    submission.evaluations = submission.evaluations.filter(
      (ev) => ev.evaluatorId.toString() !== evaluatorId.toString()
    );

    submission.evaluations.push({
      evaluatorId,
      rubricScores,
      totalScore,
      feedback: feedback || '',
      evaluatedAt: new Date(),
    });

    // Compute updated average score across all evaluators
    const avgScore =
      submission.evaluations.reduce((acc, ev) => acc + ev.totalScore, 0) / submission.evaluations.length;
    submission.averageScore = parseFloat(avgScore.toFixed(2));

    if (verdict) {
      submission.verdict = verdict;
    }

    await submission.save();

    return res.status(200).json({
      success: true,
      message: 'Evaluation saved successfully',
      data: submission,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/events/:eventId/rounds/:roundNumber/advance
 * @desc    Shortlist & advance qualified teams/participants to next round
 * @access  Private (Org Admin, Admin)
 */
export const advanceTeamsToNextRound = async (req, res) => {
  try {
    const { eventId, roundNumber } = req.params;
    const { shortlistedTeamIds, eliminateRemaining } = req.body;
    const currentRound = parseInt(roundNumber, 10);
    const nextRound = currentRound + 1;

    if (!Array.isArray(shortlistedTeamIds) || shortlistedTeamIds.length === 0) {
      return res.status(400).json({ success: false, message: 'List of shortlisted team IDs is required' });
    }

    // Advance shortlisted teams
    await Team.updateMany(
      {
        _id: { $in: shortlistedTeamIds },
        eventId,
      },
      {
        $set: { currentRoundNumber: nextRound, isEliminated: false },
      }
    );

    // Update verdicts in submissions
    await Submission.updateMany(
      {
        eventId,
        roundNumber: currentRound,
        teamId: { $in: shortlistedTeamIds },
      },
      {
        $set: { verdict: 'shortlisted' },
      }
    );

    // If eliminateRemaining is true, flag all non-shortlisted teams
    if (eliminateRemaining) {
      await Team.updateMany(
        {
          _id: { $nin: shortlistedTeamIds },
          eventId,
          currentRoundNumber: currentRound,
        },
        {
          $set: { isEliminated: true },
        }
      );

      await Submission.updateMany(
        {
          eventId,
          roundNumber: currentRound,
          teamId: { $nin: shortlistedTeamIds },
        },
        {
          $set: { verdict: 'rejected' },
        }
      );
    }

    // Update event's current round number if needed
    const event = await Event.findById(eventId);
    if (event && event.currentRoundNumber < nextRound) {
      event.currentRoundNumber = nextRound;
      await event.save();
    }

    return res.status(200).json({
      success: true,
      message: `Successfully advanced ${shortlistedTeamIds.length} teams to Round ${nextRound}!`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/events/:eventId/leaderboard
 * @desc    Get public ranking and round status for an event
 * @access  Public
 */
export const getEventLeaderboard = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { roundNumber } = req.query;

    const query = { eventId };
    if (roundNumber) {
      query.roundNumber = parseInt(roundNumber, 10);
    }

    const submissions = await Submission.find(query)
      .populate('teamId', 'name members currentRoundNumber isEliminated')
      .populate('userId', 'name avatar academicProfile')
      .sort({ averageScore: -1 })
      .limit(50);

    return res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
