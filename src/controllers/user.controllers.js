import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIError.js";
import { User } from "../models/user.models.js";
import {
  uploadToCloudinary,
  configureCloudinary,
} from "../utils/fileUpload.js";
import ApiResponse from "../utils/ApiResponse.js";

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
    throw new ApiError("Email or Password  is required", 400);
  }
  const user = await User.findOne({ $or: [{ email }] });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError("Invalid password", 401);
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
      $set: { refreshToken: undefined },
    },
    { new: true }
  );
  if (!user) {
    throw new ApiError("User not found", 404);
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
  ).select("password");
  res
    .status(200)
    .json(new ApiResponse(200, "Avatar updated successfully", user));
});
