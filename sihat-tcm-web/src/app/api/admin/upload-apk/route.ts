import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { devLog } from "@/lib/systemLogger";

// Configure route for file uploads
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for large file uploads

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", details: authError }, { status: 401 });
    }

    // Verify admin role via profile table if needed, or rely on RLS/claims if set up.
    // For now, we'll assume the client checked, but ideally we check DB role here.
    // Simplified check:
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Log request details for debugging
    const contentType = req.headers.get("content-type");
    const contentLength = req.headers.get("content-length");
    devLog("info", "APKUpload", "Upload request received", { contentType, contentLength });

    let formData;
    try {
      formData = await req.formData();
    } catch (parseError: any) {
      console.error("FormData parse error:", parseError);
      console.error("Error stack:", parseError.stack);
      return NextResponse.json(
        {
          error: "Failed to parse body as FormData",
          details: parseError.message || String(parseError),
          contentType: contentType || "not set",
          contentLength: contentLength || "not set",
        },
        { status: 400 }
      );
    }
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.endsWith(".apk")) {
      return NextResponse.json(
        { error: "Invalid file type. Only .apk files are allowed." },
        { status: 400 }
      );
    }

    devLog("info", "APKUpload", `Receiving APK upload: ${file.name}`, { size: file.size });

    // Save to public directory
    const publicDir = join(process.cwd(), "public");
    const targetPath = join(publicDir, "sihat-tcm.apk");

    // Attempt to delete existing file to avoid lock issues (EBUSY)
    if (existsSync(targetPath)) {
      try {
        await unlink(targetPath);
      } catch (e) {
        console.warn("Failed to delete existing APK, attempting overwrite:", e);
      }
    }

    // Use streaming to write file to minimize memory usage
    // Note: fs/promises doesn't have createWriteStream, used fs
    const { createWriteStream } = await import("fs");
    const { Readable } = await import("stream");
    // @ts-ignore - Readable.fromWeb is available in recent Node versions
    const stream = Readable.fromWeb(file.stream());

    await new Promise((resolve, reject) => {
      const writeStream = createWriteStream(targetPath);
      stream.pipe(writeStream);
      writeStream.on("finish", () => resolve(null));
      writeStream.on("error", reject);
    });

    // Backup to mobile directory
    try {
      // Assuming directory structure:
      // /Projects/Sihat TCM/sihat-tcm-web (webapp)
      // /Projects/Sihat TCM/sihat-tcm-mobile (mobile app)
      // process.cwd() is webapp root
      const mobileDir = join(process.cwd(), "..", "sihat-tcm-mobile");
      const mobileTargetPath = join(mobileDir, "sihat-tcm.apk");

      if (existsSync(mobileTargetPath)) {
        try {
          await unlink(mobileTargetPath);
        } catch (e) {
          console.warn("Backup unlink failed", e);
        }
      }

      // Copy from the file we just wrote (safer than reading stream again)
      const { copyFile } = await import("fs/promises");
      await copyFile(targetPath, mobileTargetPath);
      devLog("info", "APKUpload", "Backed up APK to mobile directory");
    } catch (e: any) {
      console.warn("Could not save copy to mobile directory - ignoring", e.message);
    }

    return NextResponse.json({
      success: true,
      message: `APK uploaded successfully (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      path: "/sihat-tcm.apk",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error.message || String(error),
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
