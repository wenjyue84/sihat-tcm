import { getApiDocs } from "@/lib/docs/swagger";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/doc:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the complete OpenAPI specification for the Sihat TCM API
 *     tags:
 *       - Documentation
 *     responses:
 *       200:
 *         description: OpenAPI specification object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
  try {
    const spec = getApiDocs();

    return NextResponse.json(spec, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating API documentation:", error);

    return NextResponse.json(
      {
        error: "Failed to generate API documentation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
