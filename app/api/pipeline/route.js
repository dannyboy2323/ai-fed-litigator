import { runLegalPipeline } from '@/lib/aiOrchestrator'

export async function POST(req) {
  const data = await req.json()
  // { userPrompt, uploadedFiles: [base64 or file refs] }
  const outputs = await runLegalPipeline(data)
  return Response.json(outputs)
}