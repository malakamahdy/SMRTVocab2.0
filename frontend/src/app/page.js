'use client'
import React, { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  // State to hold the email and password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent default form submission behavior
    console.log('Login attempt with:', { email, password });
    // TODO: Add your authentication logic here (e.g., API call)
  };

  return (
    // The main background is now controlled by the `body` tag in globals.css
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full max-w-md flex-1">
            <div className="flex flex-col items-center gap-6 p-4">
              <div className="flex flex-col items-center gap-4 text-center">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '48px' }}>
                  SMRT Vocab 2.0
                </span>
                <p className="text-4xl font-display font-bold leading-tight tracking-[-0.033em] text-text-primary">
                  Welcome Back
                </p>
              </div>

              {/* Form Element */}
              <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
                {/* Email Input */}
                <label className="flex flex-col w-full">
                  <p className="text-base font-medium leading-normal pb-2 text-text-primary">Email</p>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary focus:outline-0 focus:ring-2 focus:ring-accent border border-gray-300 dark:border-gray-600 bg-secondary-background min-h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-3 text-base font-normal leading-normal"
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
                
                {/* Password Input */}
                <div className="flex flex-col w-full">
                  <label className="flex flex-col w-full">
                    <p className="text-base font-medium leading-normal pb-2 text-text-primary">Password</p>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary focus:outline-0 focus:ring-2 focus:ring-accent border border-gray-300 dark:border-gray-600 bg-secondary-background min-h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-3 text-base font-normal leading-normal"
                      placeholder="Enter your password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </label>
                  <p className="text-accent text-sm font-normal leading-normal self-end pt-2 underline cursor-pointer">
                    Forgot Password?
                  </p>
                </div>
                
                {/* Submit and Register */}
                <div className="flex flex-col w-full items-center gap-4">
                  <button
                    type="submit"
                    className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-opacity-90 transition-colors shadow-md"
                  >
                    <Link href="/Landingpage">
                      <span className="truncate">Login</span>
                    </Link>
                  </button>
                  <p className="text-sm font-normal leading-normal text-center text-text-primary">
                    Don't have an account? <span className="text-accent underline cursor-pointer font-semibold">Register</span>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};