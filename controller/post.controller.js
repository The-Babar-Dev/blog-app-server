import ImageKit from "imagekit";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import * as dotenv from "dotenv";
dotenv.config();

export const getPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;

  const query = {};

  const cat = req.query.cat;
  const author = req.query.author;
  const searchQuery = req.query.search;
  const sortedQuery = req.query.sort;
  const featured = req.query.featured;

  if (cat) query.category = cat;
  if (searchQuery) query.title = { $regex: searchQuery, $options: "i" };
  if (author) {
    const user = await User.findOne({ username: author }).select("_id");
    if (!user) return res.status(404).json("No Post found!");
    query.user = user._id;
  }

  let sortObject = { createdAt: -1 };

  if (sortedQuery) {
    switch (sortedQuery) {
      case "newest":
        sortObject = { createdAt: -1 };
        break;
      case "oldest":
        sortObject = { createdAt: 1 };
        break;
      case "popular":
        sortObject = { visit: -1 };
        break;
      case "trending":
        sortObject = { visit: -1 };
        query.createdAt = {
          $gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
        };
        break;

      default:
        break;
    }
  }
  if (featured) query.isFeatured = true;

  const posts = await Post.find(query)
    .populate("user", "username")
    .sort(sortObject)
    .limit(limit)
    .skip((page - 1) * limit);

  const totalPosts = await Post.countDocuments();
  const hasMore = page * limit < totalPosts;

  res.status(200).json({ hasMore, posts });
};

export const getPost = async (req, res) => {
  const { slug } = req.params;
  const post = await Post.findOne({ slug }).populate("user", "username img");
  res.status(200).json(post);
};

export const createPost = async (req, res) => {
  const clerkUserId = req.auth.userId;

  if (!clerkUserId) res.status(401).json("Not Authenticated");

  const user = await User.findOne({ clerkUserId });

  if (!user) res.status(401).json("User not exist");

  const slug = req.body.title?.replace(/ /g, "-")?.toLowerCase();

  let existingSlug = await Post.findOne({ slug });

  let counter = 2;
  while (existingSlug) {
    slug = `${slug}-${counter}`;
    existingSlug = await Post.findOne({ slug });
    counter++;
  }
  const newPost = new Post({ user: user._id, slug, ...req.body });
  const post = await newPost.save();
  res.status(201).send(post);
};

export const deletePost = async (req, res) => {
  const clerkUserId = req.auth.userId;

  if (!clerkUserId) res.status(401).json("Not Authenticated");

  const role = req.auth?.sessionClaims?.metadata?.role || "user";

  if (role === "admin") {
    await Post.findByIdAndDelete(req.params.id);
    return res.status(200).json("Post has been deleted");
  }

  const user = await User.findOne({ clerkUserId });

  if (!user) res.status(401).json("User not exist");

  const deletedPost = await Post.findByIdAndDelete({
    _id: req.params.id,
    user: user._id,
  });

  if (!deletedPost)
    return res.status(403).json("You can delete only your posts!");

  res.status(200).send("Post Deleted");
};

export const featurePost = async (req, res) => {
  const clerkUserId = req.auth.userId;
  const postId = req.body.postId;

  if (!clerkUserId) {
    return res.status(401).json("Not authenticated!");
  }

  const role = req.auth.sessionClaims?.metadata?.role || "user";

  if (role !== "admin") {
    return res.status(403).json("You cannot feature posts!");
  }

  const post = await Post.findById(postId);

  if (!post) {
    return res.status(404).json("Post not found!");
  }

  const isFeatured = post.isFeatured;

  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    {
      isFeatured: !isFeatured,
    },
    { new: true }
  );

  res.status(200).json(updatedPost);
};

const imageKit = new ImageKit({
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

export const uploadAuth = async (req, res) => {
  var result = imageKit.getAuthenticationParameters();
  res.send(result);
};
