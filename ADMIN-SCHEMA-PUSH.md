# Push Admin Schema to InstantDB

## ✅ Step 1 Complete: Schema Updated

The InstantDB schema has been updated with three new entities for the admin panel:

1. **adminUsers** - Admin user roles and permissions
2. **auditLogs** - Immutable audit trail of all admin actions
3. **userStatus** - User account status (active/suspended/banned)

## 🚀 Push Schema to InstantDB

### Method 1: Using InstantDB CLI (Recommended)

```bash
# Push the schema to your InstantDB app
npx instant-cli push-schema
```

Or use the existing script:
```bash
./push-instant-schema.sh
```

### Method 2: Manual Push via Dashboard

1. Go to [InstantDB Dashboard](https://instantdb.com/dash)
2. Select your app
3. Go to Schema tab
4. Copy the contents of `instant.schema.ts`
5. Paste and save

## 📋 What Happens Next

After pushing the schema, InstantDB will:
- ✅ Create the new tables (adminUsers, auditLogs, userStatus)
- ✅ Add indexes for efficient querying
- ✅ Update TypeScript types automatically

## 🔐 Next: Create Your First Admin User

After the schema is pushed, you need to manually create your first admin user. Run this script:

\`\`\`bash
npm run create-first-admin
\`\`\`

Or manually add via InstantDB dashboard with these fields:
\`\`\`json
{
  "userId": "your-user-id-here",
  "role": "super_admin",
  "permissions": "[\"user.read\",\"user.write\",\"user.suspend\",\"user.delete\",\"url.read\",\"url.write\",\"url.moderate\",\"url.delete\",\"analytics.read\",\"audit.read\",\"config.read\",\"config.write\",\"admin.manage\"]",
  "mfaEnabled": false,
  "createdAt": 1704067200000,
  "createdBy": "system"
}
\`\`\`

## ⚠️ Important Notes

1. **No Data Loss**: Existing data (urls, userProfiles) is preserved
2. **Migration**: New tables start empty
3. **Permissions**: You'll need to update InstantDB permissions (see `instant.perms.ts`)

## 🎯 Next Steps

After pushing the schema:
1. ✅ Schema pushed
2. ⏭️ Create first admin user
3. ⏭️ Create admin routes (app/(admin))
4. ⏭️ Build admin UI
5. ⏭️ Configure subdomain routing

---

Ready to push? Run:
\`\`\`bash
npx instant-cli push-schema
\`\`\`

