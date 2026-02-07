import { createContext, useState, useEffect } from 'react';

// 1. Create the Context (The "Cloud")
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores user info (name, role)
  const [token, setToken] = useState(localStorage.getItem('token')); // Stores the JWT
  const [loading, setLoading] = useState(true); // "Are we still checking if logged in?"

  // 2. Check if user is already logged in when the page loads
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser)); // Restore user data
    }
    setLoading(false); // Done checking
  }, [token]);

  // 3. Login Function (We call this from the Login Page)
  const login = (userData, newToken) => {
    localStorage.setItem('token', newToken); // Save to browser
    localStorage.setItem('user', JSON.stringify(userData)); // Save user details
    setToken(newToken);
    setUser(userData);
  };

  // 4. Logout Function (We call this from the Navbar)
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // 5. Expose these values to the rest of the app
  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;