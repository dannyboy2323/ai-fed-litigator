// lib/aiOrchestrator.js

import { deepinfra } from '@ai-sdk/deepinfra'
import fs from 'fs'
import path from 'path'

const loadKnowledgeBase = (kbDir = './kb') =>
  fs.readdirSync(kbDir).reduce((kb, file) => {
    kb[file.replace('.md', '')] = fs.readFileSync(path.join(kbDir, file), 'utf-8')
    return kb
  }, {})

const callModel = async (model, input, files, kb) => {
  return await deepinfra.chat.completions.create({
    model,
    messages: [
      { role: "system", content: kb["pipeline"] + "\n" + kb["gates"] + "\n" + kb["universe"] },
      { role: "user", content: input }
    ],
    files
  })
}

export async function runLegalPipeline({ userPrompt, uploadedFiles }) {
  const kb = loadKnowledgeBase()
  let context = { userPrompt, files: uploadedFiles, kb }
  let outputs = {}

  outputs.phase1 = await callModel(process.env.MODEL_PHASE1, `
    Intake and extract all facts, actors, and legal universe per pipeline KB.
    User wants: ${userPrompt}
  `, uploadedFiles, kb)

  outputs.phase2 = await callModel(process.env.MODEL_PHASE2, `
    Using PHASE 1 output:
    - Build strategy matrix, counterplay, judge analytics, and draft battle plan.
    Prior output: ${outputs.phase1.choices?.[0]?.message?.content || ''}
  `, uploadedFiles, kb)

  outputs.phase3 = await callModel(process.env.MODEL_PHASE3, `
    Using PHASE 2 output:
    - Map issues/rules/elements, generate authority tables, and law summary.
    Prior output: ${outputs.phase2.choices?.[0]?.message?.content || ''}
  `, uploadedFiles, kb)

  outputs.phase4 = await callModel(process.env.MODEL_PHASE4, `
    Using PHASE 3 output:
    - Draft full court-ready filing per writing rules and output standards.
    Prior output: ${outputs.phase3.choices?.[0]?.message?.content || ''}
  `, uploadedFiles, kb)

  return outputs
}