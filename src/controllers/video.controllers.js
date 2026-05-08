import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.models.js";
import {
  configureCloudinary,
  uploadToCloudinary,
} from "../utils/fileUpload.js";
import mongoose, { isValidObjectId } from "mongoose";

export const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const filter = { isPublished: true };
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
    .populate("owner", "fullname username avatar")
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

export const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError("Invalid video ID", 400);
  }
  const video = await Video.findById(videoId).populate(
    "owner",
    "username fullname avatar"
  );
  if (!video) {
    throw new ApiError("Video not found", 404);
  }
  res.json(new ApiResponse(true, "Video fetched successfully", video));
});

export const updateVideo = asyncHandler(async (req, res) => {
  configureCloudinary();

  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError("Invalid video ID", 400);
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError("Video not found", 404);
  }

  // owner check
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized", 403);
  }

  // update text fields
  if (title) video.title = title;
  if (description) video.description = description;

  // thumbnail update
  const thumbnailPath = req.files?.thumbnail?.[0]?.path || req.file?.path;

  if (thumbnailPath) {
    const thumbnailUpload = await uploadToCloudinary(thumbnailPath);

    if (!thumbnailUpload?.secure_url) {
      throw new ApiError("Thumbnail upload failed", 500);
    }

    video.thumbnailUrl = thumbnailUpload.secure_url;
  }

  await video.save();

  res
    .status(200)
    .json(new ApiResponse(true, "Video updated successfully", video));
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this video");
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to change publish status");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        `Video is now ${video.isPublished ? "Published" : "Unpublished"}`
      )
    );
});

export const incrementVideoViews = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }
  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true }
  );
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "View incremented", { views: video.views }));
});
