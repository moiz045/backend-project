// const asyncHandler = (requestHandler) => async (req, res, next) => {
//   try {
//     await requestHandler(req, res, next);
//   } catch (error) {
//     return res.status(error.status || 500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//     next(error);
//   }
// };

const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error));
};

export default asyncHandler;
