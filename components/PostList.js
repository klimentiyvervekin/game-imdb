import PostCard from "./PostCard";

export default function PostList({ posts }) {
  return (
    <div className="feed">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
