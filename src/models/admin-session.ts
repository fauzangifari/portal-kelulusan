import mongoose, { Model, Schema } from "mongoose";

export type AdminSessionDocument = {
  token: string;
  expiresAt: Date;
};

const adminSessionSchema = new Schema<AdminSessionDocument>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { versionKey: false },
);

adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export function getAdminSessionModel(): Model<AdminSessionDocument> {
  return (
    (mongoose.models.AdminSession as Model<AdminSessionDocument> | undefined) ??
    mongoose.model<AdminSessionDocument>(
      "AdminSession",
      adminSessionSchema,
      "admin_sessions",
    )
  );
}
