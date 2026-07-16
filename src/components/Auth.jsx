import React, { useState } from 'react';
import { useNotes } from '../context/NotesContext';
import styles from './Auth.module.css';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Notebook, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
  const {
    login,
    register,
    loginOffline,
    isFirebaseSupported
  } = useNotes();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || (isRegister && !username)) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        await register(email, password, username);
      } else {
        await login(email, password);
      }
    } catch (err) {
      console.error(err);
      // Clean up Firebase error messages
      let friendlyMessage = 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email address is already in use.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password is too weak.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Incorrect email or password.';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setEmail('');
    setPassword('');
    setUsername('');
  };

  return (
    <div className={styles.container}>
      {/* Background decoration elements */}
      <div className={styles.circle1} />
      <div className={styles.circle2} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, cubicBezier: [0.2, 0.8, 0.2, 1] }}
        className={`${styles.card} glass`}
      >
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <Notebook size={20} fill="currentColor" />
          </div>
          <span className={styles.logoText}>YellowNotes</span>
        </div>

        <h2 className={styles.title}>
          {isRegister ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        <p className={styles.subtitle}>
          {isRegister
            ? 'Sign up to sync your notes in the cloud across all your devices.'
            : 'Sign in to access your cloud-synchronized notes database.'}
        </p>

        {/* Firebase Config warning */}
        {!isFirebaseSupported && (
          <div className={styles.configAlert}>
            <AlertCircle size={16} style={{ float: 'left', marginRight: '8px', marginTop: '2px' }} />
            <span>
              <strong>Note:</strong> Firebase is not configured yet. Build/deploy keys must be populated in the <code>.env</code> file. Click below to continue offline.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <AnimatePresence mode="wait">
            {isRegister && (
              <motion.div
                key="username-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={styles.formGroup}
              >
                <label className={styles.label} htmlFor="username">
                  Username
                </label>
                <div className={styles.inputWrapper}>
                  <User size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.input}
                    placeholder="John Doe"
                    disabled={!isFirebaseSupported || loading}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">
              Email Address
            </label>
            <div className={styles.inputWrapper}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="name@example.com"
                disabled={!isFirebaseSupported || loading}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                disabled={!isFirebaseSupported || loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.pwdToggle}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={!isFirebaseSupported || loading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {isFirebaseSupported && (
            <motion.button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Processing...' : isRegister ? 'Sign Up' : 'Sign In'}
            </motion.button>
          )}

          {isFirebaseSupported && (
            <div className={styles.divider}>Or</div>
          )}

          <motion.button
            type="button"
            onClick={loginOffline}
            className={`${styles.btn} ${styles.btnOutline}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles size={16} />
            <span>Continue Offline</span>
          </motion.button>
        </form>

        {isFirebaseSupported && (
          <div className={styles.toggleLink}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <span onClick={toggleAuthMode} className={styles.linkText}>
              {isRegister ? 'Sign In' : 'Sign Up'}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;
