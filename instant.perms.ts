// instant.perms.ts
// This file defines permissions for InstantDB
// Run `npx instant-cli push-perms` to push this to your InstantDB app

export default {
  urls: {
    // Anyone can create URLs (logged in or anonymous)
    allow: {
      create: 'true',
      // Users can read all URLs
      view: 'true',
      // Users can update their own URLs or anonymous URLs
      update: "data.userId == auth.id || data.userId == 'anonymous'",
      // Users can delete their own URLs
      delete: "data.userId == auth.id",
    },
  },
  userProfiles: {
    allow: {
      // Only authenticated users can create profiles
      create: 'auth.id != null',
      // Anyone can view profiles
      view: 'true',
      // Users can only update their own profile
      update: 'data.userId == auth.id',
      // Users can only delete their own profile
      delete: 'data.userId == auth.id',
    },
  },
};
