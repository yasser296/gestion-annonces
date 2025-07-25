// WishlistContext.js
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';

// const WishlistContext = createContext();

// export const useWishlist = () => useContext(WishlistContext);

// export const WishlistProvider = ({ children }) => {
//   const [wishlistCount, setWishlistCount] = useState(0);
//   const userToken = localStorage.getItem('token');

//   const fetchWishlistCount = async () => {
//     if (!userToken) return;

//     try {
//       const response = await axios.get('${process.env.REACT_APP_API_URL}/api/wishlist/count', {
//         headers: { Authorization: `Bearer ${userToken}` }
//       });
//       setWishlistCount(response.data.count);
//     } catch (error) {
//       console.error('Erreur:', error);
//     }
//   };

//   useEffect(() => {
//     fetchWishlistCount();
//   }, [userToken]);

//   return (
//     <WishlistContext.Provider value={{ wishlistCount, refreshWishlistCount: fetchWishlistCount }}>
//       {children}
//     </WishlistContext.Provider>
//   );
// };
