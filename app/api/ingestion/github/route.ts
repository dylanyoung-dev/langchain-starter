import { NextRequest, NextResponse } from "next/server";

// Request to update the vector store with data from Github Repo
export const POST = async (req: NextRequest) => {
    const queryPath = req.nextUrl.searchParams;
    const repoPath: string | null = queryPath.get("repoPath");  // format is username(org)/repoName

    if (repoPath === null) {
        return NextResponse.json({ error: "No repo path provided" }, { status: 400 });
    }

    // Pull zip file from Github and extract and load vectors
    try {
        const response = await fetch(`https://api.github.com/repos/${repoPath}/zipball`);
        const zip = await response.arrayBuffer();
        const zipFile = new JSZip();
        await zipFile.loadAsync(zip);
        const files = zipFile.file(/\.txt$/);
        const text = await Promise.all(files.map(async (file) => {
            return await file.async("text");
        }));
        const vectorStore = await SupabaseVectorStore.fromDocuments(text, new OpenAIEmbeddings(), {
            client,
            tableName: "documents",
            queryName: "match_documents",
        });
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}