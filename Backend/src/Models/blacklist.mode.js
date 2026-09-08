import mongoose from "mongoose";

const blacklistTokenSchema = new mongoose.Schema({
    token:{
        type:String,
        required:[true, "token is required to be added in blacklist"],
        index:true
    },

},{timestamps:true})

// Auto-purge blacklisted tokens once they'd have expired naturally (JWT expiresIn: "1d")
blacklistTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 })

export const TokenBlacklistModel = mongoose.model("blacklistTokens",blacklistTokenSchema )