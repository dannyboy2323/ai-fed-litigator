'use client'
import React, { useState } from 'react'

const PipelinePage = () => {
  const [userPrompt, setUserPrompt] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [output, setOutput] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  // Prepare and send API request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setOutput(null)
    // Convert files to base64 or upload to server as needed
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
    const data = await res.json()
    setOutput(data)
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-2xl py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">AI Legal Pipeline (DeepInfra Orchestrated)</h1>
      <form onSubmit={handleSubmit} className="mb-8">
        <label className="block mb-2 font-semibold">Upload Case Files:</label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="mb-4"
        />
        <label className="block mb-2 font-semibold">Describe Your Goal:</label>
        <textarea
          className="w-full p-2 border rounded mb-4"
          value={userPrompt}
          onChange={e => setUserPrompt(e.target.value)}
          placeholder='Ex: "I need a writ of certiorari"'
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Run Pipeline'}
        </button>
      </form>

      {output && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold text-lg mb-2">Pipeline Output</h2>
          {['phase1', 'phase2', 'phase3', 'phase4'].map((phase, idx) => (
            output[phase]?.choices?.[0]?.message?.content ? (
              <div key={phase} className="mb-4">
                <h3 className="font-semibold mb-1">Phase {idx+1}</h3>
                <div
                  className="prose prose-sm"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(output[phase].choices[0].message.content),
                  }}
                />
              </div>
            ) : null
          ))}
        </div>
      )}
    </div>
  )
}

export default PipelinePage