import mongoose from 'mongoose';

const collegeProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'College or Organization name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['university', 'college', 'engineering_college', 'tech_club', 'autonomous_institute', 'corporate'],
      default: 'college',
    },
    officialEmail: {
      type: String,
      required: [true, 'Official contact email is required'],
      lowercase: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    logoUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&auto=format&fit=crop&q=80',
    },
    bannerUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop&q=80',
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    location: {
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    verificationDocuments: [
      {
        docType: { type: String, enum: ['aicte_letter', 'club_charter', 'faculty_id', 'other'], default: 'aicte_letter' },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    primaryAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adminTeam: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    metrics: {
      totalEventsPublished: { type: Number, default: 0 },
      totalRegistrationsEngaged: { type: Number, default: 0 },
      rating: { type: Number, default: 4.8 },
    },
  },
  { timestamps: true }
);

collegeProfileSchema.index({ name: 'text', description: 'text', 'location.city': 'text' });

const CollegeProfile = mongoose.models.CollegeProfile || mongoose.model('CollegeProfile', collegeProfileSchema);
export default CollegeProfile;
