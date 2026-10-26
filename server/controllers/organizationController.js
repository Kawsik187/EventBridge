import Organization from '../models/Organization.js';
import Event from '../models/Event.js';
import User from '../models/User.js';

/**
 * @route   POST /api/organizations
 * @desc    Create / Onboard a new College or Host Organization
 * @access  Private
 */
export const createOrganization = async (req, res) => {
  try {
    const { name, type, description, website, officialDomain, city, state, country, logo, bannerImage } = req.body;
    const userId = req.user._id;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Valid organization name is required' });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existing = await Organization.findOne({ slug });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An organization with a similar name already exists' });
    }

    const organization = new Organization({
      name: name.trim(),
      slug,
      type: type || 'college',
      description: description || '',
      website: website || '',
      officialDomain: officialDomain ? officialDomain.toLowerCase().trim() : '',
      location: {
        city: city || 'Online',
        state: state || '',
        country: country || 'India',
      },
      logo: logo || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&auto=format&fit=crop&q=60',
      bannerImage: bannerImage || '',
      admins: [userId],
      createdBy: userId,
      verificationStatus: 'approved', // auto-approved for rapid development & demo
    });

    await organization.save();

    // Upgrade the user to org_admin and link organization
    await User.findByIdAndUpdate(userId, {
      role: 'org_admin',
      organizationId: organization._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Organization created successfully!',
      data: organization,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/organizations
 * @desc    Get all organizations (Directory)
 * @access  Public
 */
export const getOrganizations = async (req, res) => {
  try {
    const { search, type } = req.query;
    const query = { verificationStatus: 'approved' };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (type) {
      query.type = type;
    }

    const organizations = await Organization.find(query).sort({ name: 1 });
    return res.status(200).json({ success: true, count: organizations.length, data: organizations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/organizations/:slug
 * @desc    Get organization profile and its public events
 * @access  Public
 */
export const getOrganizationBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const organization = await Organization.findOne({ slug });

    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const events = await Event.find({
      organizationId: organization._id,
      status: { $in: ['published', 'active', 'open', 'approved'] },
    }).sort({ registrationEndDate: -1 });

    return res.status(200).json({
      success: true,
      data: {
        organization,
        events,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
