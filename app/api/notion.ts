"use server"

export async function fetchNotionDatabase() {
  try {
    const NOTION_API_KEY = process.env.NOTION_API_KEY
    const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID

    if (!NOTION_API_KEY) {
      throw new Error("NOTION_API_KEY is not defined")
    }

    if (!NOTION_DATABASE_ID) {
      throw new Error("NOTION_DATABASE_ID is not defined")
    }

    const headers = {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    }

    // First, get database metadata to get the title
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`, {
      method: "GET",
      headers: headers,
    })

    if (!dbResponse.ok) {
      const errorData = await dbResponse.text()
      throw new Error(`Notion API error getting database: ${dbResponse.status} ${errorData}`)
    }

    const dbData = await dbResponse.json()

    // Then query the database contents
    const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        page_size: 100, // Increase if you have more items
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Notion API error querying database: ${response.status} ${errorData}`)
    }

    const data = await response.json()

    // Add database title to the response
    data.title = extractDatabaseTitle(dbData)
    data.parent = dbData.parent

    // Log the structure to help with debugging
    console.log("Database structure:", {
      title: data.title,
      totalResults: data.results ? data.results.length : 0,
      properties: data.results && data.results.length > 0 ? Object.keys(data.results[0].properties) : [],
    })

    return {
      success: true,
      data: data,
    }
  } catch (error) {
    console.error("Error fetching Notion data:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch data from Notion",
    }
  }
}

// Extract the database title from the database metadata
function extractDatabaseTitle(dbData: any): string {
  try {
    if (dbData.title && Array.isArray(dbData.title)) {
      return dbData.title.map((t: any) => t.plain_text).join("")
    }

    if (dbData.title && typeof dbData.title === "object") {
      const titleParts = Object.values(dbData.title)
        .filter((part: any) => part && part.plain_text)
        .map((part: any) => part.plain_text)

      if (titleParts.length > 0) {
        return titleParts.join("")
      }
    }

    return "52g 디지털 서비스 관리 현황"
  } catch (error) {
    console.error("Error extracting database title:", error)
    return "52g 디지털 서비스 관리 현황"
  }
}
