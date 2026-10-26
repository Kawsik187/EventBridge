import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization/College name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['university', 'college', 'tech_club', 'corporate', 'ngo'],
      default: 'college',
    },
    logo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&auto=format&fit=crop&q=60',
    },
    bannerImage: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    officialDomain: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
      comment: 'e.g. stanford.edu for student auto-affiliation',
    },
    location: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'approved', // auto-approved for existing seed/demo compatibility
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

organizationSchema.index({ slug: 1, verificationStatus: 1 });
organizationSchema.index({ name: 'text', description: 'text' });

const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;
