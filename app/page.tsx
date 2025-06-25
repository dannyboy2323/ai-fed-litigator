'use client'

import { useState } from 'react'
import { marked } from 'marked'

export default function Page() {
  const [userPrompt, setUserPrompt] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [output, setOutput] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle multiple file uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  // Run pipeline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setOutput(null)
    try {
      // Convert files to base64 (DataURL) with name
      const filePromises = files.map(file =>
        new Promise<{ name: string; content: string }>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () =>
            resolve({ name: file.name, content: reader.result as string })
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      )
      const fileContents = await Promise.all(filePromises)
      // API POST
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt,
          uploadedFiles: fileContents,
        }),
      })
      if (!res.ok) {
        throw new Error('Pipeline API error')
      }
      const data = await res.json()
      setOutput(data)
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    }
    setLoading(false)
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-4">AI-Orchestrated Legal Pipeline</h1>
      <form onSubmit={handleSubmit} className="space-y-6 mb-10">
        <div>
          <label className="block font-semibold mb-1">Upload Case Files</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="mb-2"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Describe Your Goal</label>
          <textarea
            className="w-full p-2 border rounded"
            rows={3}
            value={userPrompt}
            onChange={e => setUserPrompt(e.target.value)}
            placeholder='Ex: "I need a writ of certiorari"'
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-700 text-white px-4 py-2 rounded font-semibold"
          disabled={loading}
        >
          {loading ? 'Running Pipeline...' : 'Run Pipeline'}
        </button>
      </form>

      {error && (
        <div className="text-red-700 font-semibold mb-4">{error}</div>
      )}

      {output && (
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-bold text-lg mb-3">Pipeline Output</h2>
          {['phase1', 'phase2', 'phase3', 'phase4'].map((phase, idx) => (
            output[phase]?.choices?.[0]?.message?.content ? (
              <div key={phase} className="mb-6">
                <div className="font-semibold mb-2">Phase {idx + 1}</div>
                <div
                  className="prose prose-sm"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(
                      output[phase].choices[0].message.content
                    ),
                  }}
                />
              </div>
            ) : null
          ))}
        </div>
      )}
    </main>
  )
}