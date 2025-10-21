# API Contract Validation

**Version**: 1.0.0  
**Last Updated**: October 18, 2025  
**Purpose**: Document all API endpoint contracts to prevent breaking changes

---

## 🎯 Contract Validation Rules

### Breaking Changes ❌
- Removing endpoints
- Removing request/response fields
- Changing field types
- Adding required parameters without defaults
- Changing HTTP methods
- Modifying route paths

### Non-Breaking Changes ✅
- Adding new endpoints
- Adding optional parameters
- Adding new response fields
- Deprecating (but not removing) endpoints
- Adding new HTTP methods to existing routes

---

## 📋 API Endpoint Contracts

### AccountController (`/api/Account`)

#### GET `/api/Account/UserInfo`
**Purpose**: Get current authenticated user information

**Request Contract**:
```http
GET /api/Account/UserInfo
Authorization: Bearer {jwt_token}
```

**Response Contract (200 OK)**:
```json
{
  "userId": "string",
  "email": "string",
  "name": "string",
  "role": "string",
  "auth0Id": "string"
}
```

**Errors**:
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - Token valid but user not found

**Breaking Changes Would Be**:
- Removing any field from response
- Changing field types
- Removing Authorization requirement

---

#### POST `/api/Account/Logout`
**Purpose**: Log out current user

**Request Contract**:
```http
POST /api/Account/Logout
Authorization: Bearer {jwt_token}
```

**Response Contract (200 OK)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### SessionController (`/api/Session`)

#### GET `/api/Session/{sessionId}`
**Purpose**: Get session details by ID

**Request Contract**:
```http
GET /api/Session/123
Authorization: Bearer {jwt_token}
```

**Path Parameters**:
- `sessionId` (integer, required) - Session ID

**Response Contract (200 OK)**:
```json
{
  "sessionId": 123,
  "title": "string",
  "description": "string",
  "speakerId": 1,
  "speakerName": "string",
  "categoryId": 5,
  "categoryName": "string",
  "groupId": 2,
  "groupName": "string",
  "audioUrl": "string",
  "duration": 3600,
  "date": "2025-10-18T00:00:00Z",
  "hasTranscript": true
}
```

**Errors**:
- `404 Not Found` - Session does not exist
- `401 Unauthorized` - No authentication

---

#### GET `/api/Session/{sessionId}/transcript`
**Purpose**: Get session transcript with timestamps

**Request Contract**:
```http
GET /api/Session/123/transcript
Authorization: Bearer {jwt_token}
```

**Response Contract (200 OK)**:
```json
{
  "sessionId": 123,
  "transcript": [
    {
      "timestamp": "00:00:30",
      "text": "Transcript segment text...",
      "sequenceNumber": 1
    }
  ]
}
```

---

### EtymologyController (`/api/etymology`)

#### GET `/api/etymology/search`
**Purpose**: Search for Arabic etymology data

**Request Contract**:
```http
GET /api/etymology/search?query=كتب&searchType=root
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `query` (string, required) - Search term (Arabic or transliteration)
- `searchType` (string, optional) - "root" | "derivative" | "auto" (default: "auto")

**Response Contract (200 OK)**:
```json
{
  "results": [
    {
      "rootId": 42,
      "arabicRoot": "كتب",
      "transliteration": "KTB",
      "meaning": "to write",
      "derivativeCount": 15
    }
  ],
  "totalResults": 1,
  "searchType": "root"
}
```

---

#### GET `/api/etymology/roots/{rootId}`
**Purpose**: Get details of specific Arabic root

**Request Contract**:
```http
GET /api/etymology/roots/42
Authorization: Bearer {jwt_token}
```

**Path Parameters**:
- `rootId` (integer, required) - Root word ID

**Response Contract (200 OK)**:
```json
{
  "rootId": 42,
  "arabicRoot": "كتب",
  "transliteration": "KTB",
  "meaning": "to write",
  "notes": "Related to writing, books, correspondence",
  "derivatives": [
    {
      "derivativeId": 100,
      "arabicWord": "كِتَاب",
      "transliteration": "kitaab",
      "meaning": "book",
      "partOfSpeech": "noun"
    }
  ]
}
```

**Errors**:
- `404 Not Found` - Root ID does not exist

---

#### POST `/api/etymology/roots/save`
**Purpose**: Create or update Arabic root

**Request Contract**:
```http
POST /api/etymology/roots/save
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "rootId": 0,
  "arabicRoot": "كتب",
  "transliteration": "KTB",
  "meaning": "to write",
  "notes": "Optional notes"
}
```

**Request Fields**:
- `rootId` (integer, required) - 0 for new, ID for update
- `arabicRoot` (string, required) - Arabic root text
- `transliteration` (string, required) - Latin transliteration
- `meaning` (string, required) - English meaning
- `notes` (string, optional) - Additional notes

**Response Contract (200 OK)**:
```json
{
  "rootId": 42,
  "success": true,
  "message": "Root saved successfully"
}
```

**Errors**:
- `400 Bad Request` - Invalid data
- `409 Conflict` - Duplicate root
- `401 Unauthorized` - Not authenticated

---

#### GET `/api/etymology/roots/{rootId}/derivatives`
**Purpose**: Get all derivatives for a root

**Request Contract**:
```http
GET /api/etymology/roots/42/derivatives
Authorization: Bearer {jwt_token}
```

**Response Contract (200 OK)**:
```json
{
  "rootId": 42,
  "derivatives": [
    {
      "derivativeId": 100,
      "arabicWord": "كِتَاب",
      "transliteration": "kitaab",
      "meaning": "book",
      "partOfSpeech": "noun",
      "usageExample": "القرآن هو كتاب الله"
    }
  ],
  "totalCount": 15
}
```

---

#### DELETE `/api/etymology/roots/{rootId}/delete`
**Purpose**: Delete Arabic root (admin only)

**Request Contract**:
```http
DELETE /api/etymology/roots/42/delete
Authorization: Bearer {jwt_token}
```

**Response Contract (200 OK)**:
```json
{
  "success": true,
  "message": "Root deleted successfully"
}
```

**Errors**:
- `403 Forbidden` - Not admin
- `404 Not Found` - Root does not exist
- `409 Conflict` - Root has derivatives (cannot delete)

---

### QuranController (`/api/Quran`)

#### GET `/api/Quran/verse/{surahNumber}/{ayahNumber}`
**Purpose**: Get specific Quran verse

**Request Contract**:
```http
GET /api/Quran/verse/1/1
Authorization: Bearer {jwt_token} (optional for public access)
```

**Path Parameters**:
- `surahNumber` (integer, required) - Surah number (1-114)
- `ayahNumber` (integer, required) - Ayah number within surah

**Response Contract (200 OK)**:
```json
{
  "surahNumber": 1,
  "ayahNumber": 1,
  "arabicText": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  "transliteration": "Bismillahir Rahmanir Raheem",
  "translations": [
    {
      "language": "en",
      "translator": "Sahih International",
      "text": "In the name of Allah, the Entirely Merciful, the Especially Merciful."
    }
  ]
}
```

**Errors**:
- `404 Not Found` - Invalid surah/ayah number

---

#### GET `/api/Quran/surah/{surahNumber}`
**Purpose**: Get all verses in a surah

**Request Contract**:
```http
GET /api/Quran/surah/1
Authorization: Bearer {jwt_token} (optional)
```

**Response Contract (200 OK)**:
```json
{
  "surahNumber": 1,
  "surahName": "Al-Fatihah",
  "surahNameArabic": "الفاتحة",
  "ayahCount": 7,
  "verses": [
    {
      "ayahNumber": 1,
      "arabicText": "...",
      "transliteration": "..."
    }
  ]
}
```

---

### AhadeesController (`/api/Ahadees`)

#### GET `/api/Ahadees/search`
**Purpose**: Search hadith collections

**Request Contract**:
```http
GET /api/Ahadees/search?query=prayer&collection=bukhari
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `query` (string, required) - Search keywords
- `collection` (string, optional) - Hadith collection name
- `page` (integer, optional) - Page number (default: 1)
- `pageSize` (integer, optional) - Results per page (default: 20)

**Response Contract (200 OK)**:
```json
{
  "results": [
    {
      "hadithId": 123,
      "collection": "Sahih Bukhari",
      "book": "Book of Prayer",
      "hadithNumber": "500",
      "arabicText": "...",
      "englishTranslation": "...",
      "narrator": "Abu Huraira"
    }
  ],
  "totalResults": 45,
  "currentPage": 1,
  "totalPages": 3
}
```

---

### GroupController (`/api/Group`)

#### GET `/api/Group`
**Purpose**: Get all groups (albums)

**Request Contract**:
```http
GET /api/Group
Authorization: Bearer {jwt_token}
```

**Response Contract (200 OK)**:
```json
{
  "groups": [
    {
      "groupId": 1,
      "name": "Tafsir Series",
      "description": "Quranic exegesis sessions",
      "categoryCount": 5,
      "sessionCount": 42
    }
  ]
}
```

---

#### GET `/api/Group/{groupId}/categories`
**Purpose**: Get categories for a group

**Request Contract**:
```http
GET /api/Group/1/categories
Authorization: Bearer {jwt_token}
```

**Response Contract (200 OK)**:
```json
{
  "groupId": 1,
  "categories": [
    {
      "categoryId": 10,
      "name": "Surah Al-Baqarah",
      "sessionCount": 8
    }
  ]
}
```

---

### GitController (`/api/git`)

#### GET `/api/git/status`
**Purpose**: Get Git repository status

**Request Contract**:
```http
GET /api/git/status
Authorization: Bearer {jwt_token}
```

**Response Contract (200 OK)**:
```json
{
  "branch": "development",
  "modifiedFiles": ["file1.cs", "file2.js"],
  "untrackedFiles": ["newfile.md"],
  "stagedFiles": [],
  "isClean": false,
  "lastCommit": {
    "hash": "abc123",
    "message": "Last commit message",
    "author": "Developer",
    "date": "2025-10-18T10:30:00Z"
  }
}
```

---

#### POST `/api/git/commit`
**Purpose**: Commit changes to Git repository

**Request Contract**:
```http
POST /api/git/commit
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "message": "Commit message",
  "filePaths": ["file1.cs", "file2.js"]
}
```

**Response Contract (200 OK)**:
```json
{
  "success": true,
  "commitHash": "abc123",
  "message": "Changes committed successfully"
}
```

---

#### POST `/api/git/push`
**Purpose**: Push commits to remote repository

**Request Contract**:
```http
POST /api/git/push
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "branch": "development",
  "remote": "origin"
}
```

**Response Contract (200 OK)**:
```json
{
  "success": true,
  "message": "Pushed to origin/development",
  "commitCount": 3
}
```

---

### AdminController (`/api/Admin`)

#### GET `/api/Admin/sessions`
**Purpose**: Get all sessions (admin view)

**Request Contract**:
```http
GET /api/Admin/sessions?status=active&page=1
Authorization: Bearer {jwt_token}
```

**Authorization**: Requires Admin role

**Query Parameters**:
- `status` (string, optional) - "active" | "archived" | "all"
- `page` (integer, optional) - Page number
- `pageSize` (integer, optional) - Results per page

**Response Contract (200 OK)**:
```json
{
  "sessions": [
    {
      "sessionId": 123,
      "title": "...",
      "status": "active",
      "speakerName": "...",
      "createdDate": "2025-01-15T00:00:00Z",
      "viewCount": 450
    }
  ],
  "totalSessions": 200,
  "currentPage": 1
}
```

---

### TokenController (`/api/Token`)

#### POST `/api/Token/refresh`
**Purpose**: Refresh JWT token

**Request Contract**:
```http
POST /api/Token/refresh
Content-Type: application/json

{
  "refreshToken": "string"
}
```

**Response Contract (200 OK)**:
```json
{
  "accessToken": "new_jwt_token",
  "refreshToken": "new_refresh_token",
  "expiresIn": 3600
}
```

---

### SearchController (`/api/Search`)

#### GET `/api/Search`
**Purpose**: Global search across all content

**Request Contract**:
```http
GET /api/Search?q=prayer&types=sessions,quran,hadith
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `q` (string, required) - Search query
- `types` (string, optional) - Comma-separated content types
- `page` (integer, optional) - Page number
- `pageSize` (integer, optional) - Results per page

**Response Contract (200 OK)**:
```json
{
  "query": "prayer",
  "results": {
    "sessions": [
      {
        "type": "session",
        "id": 123,
        "title": "...",
        "excerpt": "..."
      }
    ],
    "quranVerses": [
      {
        "type": "quran",
        "surah": 1,
        "ayah": 5,
        "excerpt": "..."
      }
    ],
    "hadith": []
  },
  "totalResults": 15
}
```

---

## 🔒 Authentication Contracts

### JWT Token Format
All authenticated endpoints require:
```http
Authorization: Bearer {jwt_token}
```

**Token Claims**:
- `sub` - User ID (Auth0 subject)
- `email` - User email
- `name` - User display name
- `role` - User role (user, admin)
- `exp` - Expiration timestamp
- `iat` - Issued at timestamp

### Common Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

#### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

#### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "The requested resource was not found"
}
```

#### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid request parameters",
  "validationErrors": {
    "fieldName": ["Error message"]
  }
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "requestId": "abc-123-def"
}
```

---

## 📊 Contract Versioning Strategy

### Current Version: v1 (Implicit)
All endpoints currently use implicit v1 (no version in route)

### Future Versioning
When breaking changes are needed:
1. Add version to route: `/api/v2/Controller`
2. Maintain v1 endpoints for backwards compatibility
3. Document migration path
4. Deprecate v1 with 6-month notice

### Deprecation Notice Format
```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 1 Jun 2026 00:00:00 GMT
Link: </api/v2/endpoint>; rel="successor-version"
```

---

## ✅ Contract Testing Guidelines

### When Adding New Endpoints
1. Document contract in this file
2. Add integration test for contract
3. Version the endpoint if needed
4. Update Swagger/API documentation

### When Modifying Endpoints
1. Identify if change is breaking
2. If breaking: create new version
3. If non-breaking: update contract docs
4. Add tests for new behavior
5. Update client code

### Contract Validation Tests
Location: `Source Code/Sessions.Tests/ApiContractTests/`

**Test each endpoint for**:
- Correct HTTP method
- Expected request format
- Expected response format
- Field types and nullability
- Error responses

---

**Contract Review Date**: October 18, 2025  
**Next Review**: On any API modification  
**Breaking Change Policy**: No breaking changes without new version
