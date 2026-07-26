import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

categorySchema.index({ userEmail: 1, name: 1 }, { unique: true });

export const Category = mongoose.model("category", categorySchema);
