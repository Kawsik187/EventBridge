import Department from '../models/Department.js';
import Event from '../models/Event.js';

export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ status: 'active' })
      .populate('activeOrganizerId', 'name email phone avatar')
      .sort({ name: 1 });

    // Include event counts for each department
    const deptIds = departments.map((d) => d._id);
    const eventCounts = await Event.aggregate([
      { $match: { departmentId: { $in: deptIds }, status: { $in: ['open', 'approved', 'live', 'completed'] } } },
      { $group: { _id: '$departmentId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    eventCounts.forEach((ec) => countMap.set(ec._id.toString(), ec.count));

    const result = departments.map((d) => {
      const dObj = d.toObject();
      dObj.eventsCount = countMap.get(d._id.toString()) || 0;
      return dObj;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments' });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('activeOrganizerId', 'name email phone avatar');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const events = await Event.find({
      departmentId: department._id,
      status: { $in: ['open', 'approved', 'live'] },
    }).populate('venueId');

    res.json({ department, events });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching department details' });
  }
};
