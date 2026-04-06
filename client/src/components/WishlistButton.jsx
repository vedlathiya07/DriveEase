/* eslint-disable */
import { useState } from "react";

export default function WishlistButton({ carId }) {
  const [liked, setLiked] = useState(false);

  const toggleWishlist = () => {
    setLiked(!liked);
    // Later connect backend
  };

  return (
    <button
      onClick={toggleWishlist}
      className="btn btn-sm"
      style={{ color: liked ? "red" : "gray" }}
    >
      ❤️
    </button>
  );
}
