import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface UserDoc extends Document {
  username: string;
  email: string;
  password: string;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 }
}, { timestamps: true });

UserSchema.pre("save", async function(next) {
  const user = this as UserDoc;
  if (!user.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function(candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.models.User || mongoose.model<UserDoc>("User", UserSchema);

export default User;

