import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Like } from "../models/like.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

export const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    user: req.user._id,
  });

  let liked = false;

  if (existingLike) {
    await existingLike.deleteOne();
  } else {
    await Like.create({
      video: videoId,
      user: req.user._id,
    });

    liked = true;
  }

  // updated likes count
  const likesCount = await Like.countDocuments({
    video: videoId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        liked,
        likesCount,
      },
      liked ? "Like added successfully" : "Like removed successfully"
    )
  );
});

export const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment ID");
  }
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  const existingLike = await Like.findOne({
    comment: commentId,
    user: req.user._id,
  });

  let liked = false;

  if (existingLike) {
    await existingLike.deleteOne();
  } else {
    await Like.create({
      comment: commentId,
      user: req.user._id,
    });
    liked = true;
  }

  // updated likes count
  const likesCount = await Like.countDocuments({
    comment: commentId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        liked,
        likesCount,
      },
      liked ? "Like added successfully" : "Like removed successfully"
    )
  );
});

export const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    user: req.user._id,
  });

  let liked = false;
  if (existingLike) {
    await existingLike.deleteOne();
  } else {
    await Like.create({
      tweet: tweetId,
      user: req.user._id,
    });
    liked = true;
  }
  const LikesCount = await Like.countDocuments({
    tweet: tweetId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        liked,
        likesCount: LikesCount,
      },
      liked ? "Like added successfully" : "Like removed successfully"
    )
  );
});

export const getVideoLikes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  const likesCount = await Like.countDocuments({
    video: videoId,
  });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        likesCount,
      },
      "Likes count fetched successfully"
    )
  );
});
