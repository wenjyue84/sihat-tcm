import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { devLog } from "@/lib/systemLogger";

const execAsync = promisify(exec);

const PER_PAGE = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = "wenjyue84/sihat-tcm";

  // Try GitHub API first if token exists
  if (GITHUB_TOKEN) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${REPO}/commits?per_page=${PER_PAGE}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
          next: { revalidate: 60 },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const commits = data.map((commit: any) => ({
          hash: commit.sha.substring(0, 7),
          date: commit.commit.author.date,
          message: commit.commit.message,
          author: commit.commit.author.name,
          source: "GitHub API",
        }));

        // Check if there are more commits by looking at Link header or response length
        const hasMore = data.length === PER_PAGE;

        return NextResponse.json({
          commits,
          source: "github",
          hasMore,
          page,
        });
      }
      devLog(
        "warn",
        "API/updates",
        `GitHub API request failed: ${response.status} ${response.statusText}`
      );
    } catch (error) {
      devLog("error", "API/updates", "GitHub API error", { error });
    }
  }

  // Fallback to local git log with pagination
  try {
    const skip = (page - 1) * PER_PAGE;
    const { stdout } = await execAsync(
      `git log -n ${PER_PAGE + 1} --skip=${skip} --pretty=format:"%h|%ad|%an|%s" --date=iso`
    );

    const lines = stdout
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);
    const hasMore = lines.length > PER_PAGE;
    const commitLines = hasMore ? lines.slice(0, PER_PAGE) : lines;

    const commits = commitLines.map((line) => {
      const parts = line.split("|");
      const hash = parts[0];
      const date = parts[1];
      const author = parts[2];
      const message = parts.slice(3).join("|");

      return {
        hash,
        date,
        author,
        message,
        source: "Local Git",
      };
    });

    return NextResponse.json({
      commits,
      source: "local",
      hasMore,
      page,
    });
  } catch (error) {
    devLog("error", "API/updates", "Local git command failed", { error });
    return NextResponse.json(
      { error: "Failed to fetch updates from both GitHub and local git" },
      { status: 500 }
    );
  }
}
