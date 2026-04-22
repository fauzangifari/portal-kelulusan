import mongoose, { Model, Schema } from "mongoose";

export type ConfigDocument = {
  key: string;
  value: string;
};

const configSchema = new Schema<ConfigDocument>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
  },
  { versionKey: false },
);

export function getConfigModel(): Model<ConfigDocument> {
  const collectionName = "configs";
  return (
    (mongoose.models.Config as Model<ConfigDocument> | undefined) ??
    mongoose.model<ConfigDocument>("Config", configSchema, collectionName)
  );
}
