import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.models.js";
import {
  configureCloudinary,
  uploadToCloudinary,
} from "../utils/fileUpload.js";
import mongoose, { isValidObjectId } from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const filter = {};
  if (query) {
    filter.title = { $regex: query, $options: "i" };
  }
  if (userId && isValidObjectId(userId)) {
    filter.owner = userId;
  }
  const sortOptions = {};
  if (sortBy) {
    sortOptions[sortBy] = sortType === "desc" ? -1 : 1;
  }
  const videos = await Video.find(filter)
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  const totalVideos = await Video.countDocuments(filter);
  res.json(
    new ApiResponse(true, "Videos fetched successfully", {
      videos,
      totalVideos,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalVideos / limit),
    })
  );
});

export const publishAVideo = asyncHandler(async (req, res) => {
  configureCloudinary();

  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError("Title and description are required", 400);
  }

  const videoFilePath = req.files?.videoFile?.[0]?.path;
  const thumbnailFilePath = req.files?.thumbnail?.[0]?.path;

  if (!videoFilePath) {
    throw new ApiError("Video file is required", 400);
  }

  if (!thumbnailFilePath) {
    throw new ApiError("Thumbnail is required", 400);
  }

  // 🎬 Upload video
  const videoUpload = await uploadToCloudinary(videoFilePath);

  // 🖼️ Upload thumbnail (normal function)
  const thumbnailUpload = await uploadToCloudinary(thumbnailFilePath);
  console.log("VIDEO:", videoUpload);
  console.log("THUMB:", thumbnailUpload);
  const video = await Video.create({
    title,
    description,
    videoUrl: videoUpload.secure_url,
    thumbnailUrl: thumbnailUpload.secure_url,
    duration: videoUpload.duration,
    owner: req.user._id,
  });

  res
    .status(201)
    .json(new ApiResponse(true, "Video published successfully", video));
});
