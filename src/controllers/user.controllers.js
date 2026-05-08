import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  uploadToCloudinary,
  configureCloudinary,
} from "../utils/fileUpload.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const getAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullname } = req.body;

  configureCloudinary();

  if (
    [username, email, password, fullname].some((field) => field?.trim() === "")
  ) {
    throw new ApiError("All fields are required", 400);
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError("User already exists", 400);
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  let coverImageLocalPath;
  if (
    req.files.coverImage &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError("Avatar image is required", 400);
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverImage = await uploadToCloudinary(coverImageLocalPath);

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullname,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError("User registration failed", 500);
  }

  res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", createdUser));
});

export const loginUser = asyncHandler(async (req, res) => {
  // Implementation for user login
  console.log(req.body);
  const { email, password } = req.body;

  if (!email && !password) {
    throw new ApiError(400, "Email or Password  is required");
  }
  const user = await User.findOne({ $or: [{ email }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const tokens = await getAccessAndRefreshTokens(user._id);
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  res
    .status(200)
    .cookie("refreshToken", tokens.refreshToken, options)
    .cookie("accessToken", tokens.accessToken, options)
    .json(new ApiResponse(200, "Login successful", loggedInUser));
});

export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, "Logout successful"));
});

export const getAccessAndRefreshToken = asyncHandler(async (req, res) => {
  const refreshedTokens = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshedTokens) {
    throw new ApiError(400, "Refresh token is required");
  }
  const decodedRefreshToken = jwt.verify(
    refreshedTokens,
    process.env.REFRESH_TOKEN_SECRET
  );
  const user = await User.findById(decodedRefreshToken.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (refreshedTokens !== user.refreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }
  const options = {
    httpOnly: true,
    secure: true,
  };

  const { accessToken, refreshToken } = await getAccessAndRefreshTokens(
    user._id
  );
  res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(200, "Tokens refreshed successfully", {
        accessToken,
        refreshToken,
      })
    );
});

export const changePassword = asyncHandler(async (req, res) => {
  // Implementation for changing user password
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isOldPasswordValid = await user.comparePassword(oldPassword);
  if (!isOldPasswordValid) {
    throw new ApiError(401, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: true });
  res.status(200).json(new ApiResponse(200, "Password changed successfully"));
});

export const getUserProfile = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(
      new ApiResponse(200, "User profile retrieved successfully", req.user)
    );
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { username, email, fullname } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { username, email, fullname } },
    { new: true }
  ).select("-password -refreshToken");
  res
    .status(200)
    .json(new ApiResponse(200, "User profile updated successfully", user));
});

export const changeAvatar = asyncHandler(async (req, res) => {
  configureCloudinary();
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }
  const avatar = await uploadToCloudinary(avatarLocalPath);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password -refreshToken");
  res
    .status(200)
    .json(new ApiResponse(200, "Avatar updated successfully", user));
});

export const changeCoverImage = asyncHandler(async (req, res) => {
  configureCloudinary();
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is required");
  }
  const coverImage = await uploadToCloudinary(coverImageLocalPath);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password -refreshToken");
  res
    .status(200)
    .json(new ApiResponse(200, "Cover image updated successfully", user));
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    { $match: { username: username.toLowerCase() } },
    {
      $lookup: {
        from: "subscribers",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },

    {
      $lookup: {
        from: "subscribers",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },

    {
      $addFields: {
        subscriberCount: { $size: "$subscribers" },
        channelSubscribedToCOunt: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: [
            { $in: [req.user._id, "$subscribers.subscriber"] },
            true,
            false,
          ],
        },
      },
    },

    {
      $project: {
        username: 1,
        fullname: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        channelSubscribedToCOunt: 1,
        isSubscribed: 1,
        email: 1,
      },
    },
  ]);

  console.log(channel);

  if (!channel || channel.length === 0) {
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Channel profile retrieved successfully", channel[0])
    );
});

export const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                  },
                },
                {
                  $addFields: {
                    owner: { $first: "$owner" },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);
  if (!user || user.length === 0) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Watch history retrieved successfully",
        user[0].watchHistory
      )
    );
});

export const addToWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }
  // Remove if exists then prepend so newest is always first, no duplicates
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { watchHistory: new mongoose.Types.ObjectId(videoId) },
  });
  await User.findByIdAndUpdate(req.user._id, {
    $push: {
      watchHistory: {
        $each: [new mongoose.Types.ObjectId(videoId)],
        $position: 0,
      },
    },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, "Added to watch history", {}));
});

export const toggleWatchLater = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  const vid = new mongoose.Types.ObjectId(videoId);
  const isSaved = user.watchLater.some((id) => id.equals(vid));

  if (isSaved) {
    user.watchLater.pull(vid);
  } else {
    user.watchLater.push(vid);
  }
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Watch Later toggled", { saved: !isSaved }));
});

export const getWatchLater = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: "watchLater",
      populate: { path: "owner", select: "fullname username avatar" },
    })
    .select("watchLater");
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Watch Later retrieved", user?.watchLater ?? [])
    );
});
