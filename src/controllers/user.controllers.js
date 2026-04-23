import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIError.js";
import { User } from "../models/user.models.js";
import {
  uploadToCloudinary,
  configureCloudinary,
} from "../utils/fileUpload.js";
import ApiResponse from "../utils/ApiResponse.js";

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
