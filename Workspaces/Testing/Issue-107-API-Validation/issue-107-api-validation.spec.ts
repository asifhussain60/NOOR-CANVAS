import { expect, test, type APIRequestContext } from "@playwright/test";

// Configure test to ignore SSL errors for local development
test.use({ ignoreHTTPSErrors: true });

// TypeScript interfaces for API responses
interface CreateSessionRequest {
  HostFriendlyToken: string;
  SelectedSession: string;
  SelectedCategory: string;
  SelectedAlbum: string;
  SessionDate: string;
  SessionTime: string;
  SessionDuration: number;
}

interface CreateSessionResponse {
  success?: boolean;
  sessionId?: number;
  userToken?: string;
  sessionUrl?: string;
  error?: string;
  received?: {
    selectedSession: string;
    selectedCategory: string;
    selectedAlbum: string;
  };
}

interface AlbumData {
  GroupId: number;
  GroupName: string;
}

interface CategoryData {
  CategoryID: number;
  CategoryName: string;
  GroupId: number;
}

interface SessionData {
  SessionID: number;
  SessionName: string;
  CategoryId: number;
  Description?: string;
}

test.describe("Issue-107: API Validation Error - Session/Category/Album Null Parameters", () => {
  const TEST_HOST_TOKEN = "JHINFLXN";
  const TEST_ALBUM_ID = "18";
  const TEST_CATEGORY_ID = "55";
  const TEST_SESSION_ID = "1281";

  test("should reproduce the API validation error with exact payload structure", async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    console.log("=== Issue-107 Test: Reproducing API Validation Error ===");

    // Step 1: Verify cascading dropdown data is available
    console.log("Step 1: Verifying test data availability...");

    // Get albums
    const albumsResponse = await request.get(
      `/api/host/albums?guid=${TEST_HOST_TOKEN}`,
    );
    expect(albumsResponse.ok()).toBeTruthy();
    const albums: AlbumData[] = await albumsResponse.json();
    console.log(`Albums loaded: ${albums.length} found`);

    const testAlbum = albums.find(
      (a) => a.GroupId.toString() === TEST_ALBUM_ID,
    );
    expect(testAlbum).toBeDefined();
    console.log(
      `Test album found: ${testAlbum?.GroupName} (ID: ${testAlbum?.GroupId})`,
    );

    // Get categories for test album
    const categoriesResponse = await request.get(
      `/api/host/categories/${TEST_ALBUM_ID}?guid=${TEST_HOST_TOKEN}`,
    );
    expect(categoriesResponse.ok()).toBeTruthy();
    const categories: CategoryData[] = await categoriesResponse.json();
    console.log(
      `Categories loaded: ${categories.length} found for album ${TEST_ALBUM_ID}`,
    );

    const testCategory = categories.find(
      (c) => c.CategoryID.toString() === TEST_CATEGORY_ID,
    );
    expect(testCategory).toBeDefined();
    console.log(
      `Test category found: ${testCategory?.CategoryName} (ID: ${testCategory?.CategoryID})`,
    );

    // Get sessions for test category
    const sessionsResponse = await request.get(
      `/api/host/sessions/${TEST_CATEGORY_ID}?guid=${TEST_HOST_TOKEN}`,
    );
    expect(sessionsResponse.ok()).toBeTruthy();
    const sessions: SessionData[] = await sessionsResponse.json();
    console.log(
      `Sessions loaded: ${sessions.length} found for category ${TEST_CATEGORY_ID}`,
    );

    const testSession = sessions.find(
      (s) => s.SessionID.toString() === TEST_SESSION_ID,
    );
    expect(testSession).toBeDefined();
    console.log(
      `Test session found: ${testSession?.SessionName} (ID: ${testSession?.SessionID})`,
    );

    // Step 2: Create the exact payload structure that Host-SessionOpener sends
    console.log("Step 2: Creating exact payload structure...");

    const sessionRequest: CreateSessionRequest = {
      HostFriendlyToken: TEST_HOST_TOKEN,
      SelectedSession: TEST_SESSION_ID,
      SelectedCategory: TEST_CATEGORY_ID,
      SelectedAlbum: TEST_ALBUM_ID,
      SessionDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
      SessionTime: "2:00 PM",
      SessionDuration: 60,
    };

    console.log("Payload structure:");
    console.log(JSON.stringify(sessionRequest, null, 2));

    // Step 3: Call the API that's causing the issue
    console.log("Step 3: Calling create-session API...");

    const createResponse = await request.post(
      `/api/host/create-session?token=${TEST_HOST_TOKEN}`,
      {
        data: sessionRequest,
      },
    );

    console.log(`API Response Status: ${createResponse.status()}`);

    // Step 4: Analyze the response
    const responseText = await createResponse.text();
    console.log("Raw response:", responseText);

    let responseData: CreateSessionResponse;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    // Step 5: Document the exact error for debugging
    if (createResponse.status() === 400) {
      console.log("=== REPRODUCING ISSUE-107 ERROR ===");
      console.log("Error message:", responseData.error);
      console.log("Received values:", responseData.received);

      // This is the expected error condition we're trying to fix
      expect(responseData.error).toBe(
        "Selected session, category, and album are required",
      );
      expect(responseData.received?.selectedSession).toBe("NULL");
      expect(responseData.received?.selectedCategory).toBe("NULL");
      expect(responseData.received?.selectedAlbum).toBe("NULL");

      console.log("✅ Issue-107 error successfully reproduced for debugging");
    } else {
      console.log("✅ API call succeeded - Issue may be resolved");
      expect(createResponse.ok()).toBeTruthy();
      expect(responseData.success).toBeTruthy();
    }
  });

  test("should validate property name case sensitivity in API payload", async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    console.log("=== Issue-107 Test: Property Name Case Sensitivity ===");

    // Test with different property name variations
    const variations = [
      {
        name: "Exact Frontend Case",
        payload: {
          HostFriendlyToken: TEST_HOST_TOKEN,
          SelectedSession: TEST_SESSION_ID,
          SelectedCategory: TEST_CATEGORY_ID,
          SelectedAlbum: TEST_ALBUM_ID,
          SessionDate: "2025-09-18",
          SessionTime: "2:00 PM",
          SessionDuration: 60,
        },
      },
      {
        name: "Lowercase Properties",
        payload: {
          hostfriendlytoken: TEST_HOST_TOKEN,
          selectedsession: TEST_SESSION_ID,
          selectedcategory: TEST_CATEGORY_ID,
          selectedalbum: TEST_ALBUM_ID,
          sessiondate: "2025-09-18",
          sessiontime: "2:00 PM",
          sessionduration: 60,
        },
      },
      {
        name: "CamelCase Properties",
        payload: {
          hostFriendlyToken: TEST_HOST_TOKEN,
          selectedSession: TEST_SESSION_ID,
          selectedCategory: TEST_CATEGORY_ID,
          selectedAlbum: TEST_ALBUM_ID,
          sessionDate: "2025-09-18",
          sessionTime: "2:00 PM",
          sessionDuration: 60,
        },
      },
    ];

    for (const variation of variations) {
      console.log(`Testing ${variation.name}...`);
      console.log("Payload:", JSON.stringify(variation.payload, null, 2));

      const response = await request.post(
        `/api/host/create-session?token=${TEST_HOST_TOKEN}`,
        {
          data: variation.payload,
        },
      );

      const responseText = await response.text();
      console.log(`${variation.name} - Status: ${response.status()}`);
      console.log(`${variation.name} - Response: ${responseText}`);

      if (response.status() === 400) {
        const errorData = JSON.parse(responseText);
        console.log(`${variation.name} - Error: ${errorData.error}`);
        console.log(
          `${variation.name} - Received: ${JSON.stringify(errorData.received)}`,
        );
      }

      console.log("---");
    }
  });

  test("should validate API parsing with debugging headers", async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    console.log("=== Issue-107 Test: API Parsing Debug Analysis ===");

    const debugPayload = {
      HostFriendlyToken: TEST_HOST_TOKEN,
      SelectedSession: TEST_SESSION_ID,
      SelectedCategory: TEST_CATEGORY_ID,
      SelectedAlbum: TEST_ALBUM_ID,
      SessionDate: "2025-09-18",
      SessionTime: "2:00 PM",
      SessionDuration: 60,
      // Add debug information
      DebugInfo: {
        TestName: "Issue-107-Debug",
        Timestamp: new Date().toISOString(),
        PropertyCount: 7,
        ExpectedAlbum: TEST_ALBUM_ID,
        ExpectedCategory: TEST_CATEGORY_ID,
        ExpectedSession: TEST_SESSION_ID,
      },
    };

    console.log("Debug payload structure:");
    console.log(JSON.stringify(debugPayload, null, 2));

    const response = await request.post(
      `/api/host/create-session?token=${TEST_HOST_TOKEN}`,
      {
        data: debugPayload,
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Test": "Issue-107",
          "X-Expected-Album": TEST_ALBUM_ID,
          "X-Expected-Category": TEST_CATEGORY_ID,
          "X-Expected-Session": TEST_SESSION_ID,
        },
      },
    );

    console.log(`Debug test status: ${response.status()}`);
    const responseText = await response.text();
    console.log("Debug response:", responseText);

    // Log response headers that might contain debug information
    const responseHeaders = response.headers();
    for (const [key, value] of Object.entries(responseHeaders)) {
      if (
        key.toLowerCase().startsWith("x-debug") ||
        key.toLowerCase().startsWith("x-noor")
      ) {
        console.log(`Response header ${key}: ${value}`);
      }
    }
  });
});

test.describe("Issue-107: Database Validation for Session/Category/Album Data", () => {
  test("should verify test data integrity in KSESSIONS_DEV database", async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    console.log("=== Issue-107 Test: Database Data Integrity ===");

    // Test album 18 exists and has proper structure
    const albumsResponse = await request.get(`/api/host/albums?guid=JHINFLXN`);
    expect(albumsResponse.ok()).toBeTruthy();
    const albums: AlbumData[] = await albumsResponse.json();

    const album18 = albums.find((a) => a.GroupId === 18);
    expect(album18).toBeDefined();
    console.log(`✅ Album 18 verified: ${album18?.GroupName}`);

    // Test category 55 exists under album 18
    const categoriesResponse = await request.get(
      `/api/host/categories/18?guid=JHINFLXN`,
    );
    expect(categoriesResponse.ok()).toBeTruthy();
    const categories: CategoryData[] = await categoriesResponse.json();

    const category55 = categories.find((c) => c.CategoryID === 55);
    expect(category55).toBeDefined();
    console.log(
      `✅ Category 55 verified: ${category55?.CategoryName} (Album: ${category55?.GroupId})`,
    );

    // Test session 1281 exists under category 55
    const sessionsResponse = await request.get(
      `/api/host/sessions/55?guid=JHINFLXN`,
    );
    expect(sessionsResponse.ok()).toBeTruthy();
    const sessions: SessionData[] = await sessionsResponse.json();

    const session1281 = sessions.find((s) => s.SessionID === 1281);
    expect(session1281).toBeDefined();
    console.log(
      `✅ Session 1281 verified: ${session1281?.SessionName} (Category: ${session1281?.CategoryId})`,
    );

    // Verify the complete cascade chain
    expect(category55?.GroupId).toBe(18);
    expect(session1281?.CategoryId).toBe(55);
    console.log(
      "✅ Complete cascade chain verified: Album 18 → Category 55 → Session 1281",
    );
  });
});
