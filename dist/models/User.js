import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
const UserSchema = new Schema({
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 }
}, { timestamps: true });
UserSchema.pre("save", async function (next) {
    const user = this;
    if (!user.isModified("password"))
        return next();
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
});
UserSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
};
const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
