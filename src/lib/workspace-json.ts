export type SimpleLink = {
  title: string
  url: string
}

export type SimpleFolder = {
  name: string
  links?: SimpleLink[]
  folders?: SimpleFolder[]
}

export type SimpleWorkspaceJson = {
  name: string
  folders?: SimpleFolder[]
  links?: SimpleLink[]
}

export type WorkspaceJsonFolder = {
  id?: string
  name: string
  parentId: string | null
}

export type WorkspaceJsonLink = {
  id?: string
  title: string
  url: string
  folderId: string | null
}

export type WorkspaceJsonPayload = {
  name: string
  folders: WorkspaceJsonFolder[]
  links: WorkspaceJsonLink[]
}

export type ValidateWorkspaceJsonResult =
  | { success: true; data: WorkspaceJsonPayload }
  | { success: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function validateSimpleFolder(folder: unknown, path: string): string | null {
  if (!isRecord(folder)) return `${path}: deve ser um objeto.`
  if (!('name' in folder) || !isString(folder.name) || (folder.name as string).trim() === '') {
    return `${path}: "name" é obrigatório e deve ser uma string não vazia.`
  }
  if ('links' in folder && folder.links !== undefined) {
    if (!isArray(folder.links)) return `${path}: "links" deve ser um array.`
    for (let i = 0; i < folder.links.length; i++) {
      const l = folder.links[i]
      if (!isRecord(l)) return `${path}.links[${i}]: deve ser um objeto.`
      if (!('title' in l) || !isString(l.title)) return `${path}.links[${i}]: "title" é obrigatório.`
      if (!('url' in l) || !isString(l.url)) return `${path}.links[${i}]: "url" é obrigatório.`
    }
  }
  if ('folders' in folder && folder.folders !== undefined) {
    if (!isArray(folder.folders)) return `${path}: "folders" deve ser um array.`
    for (let i = 0; i < folder.folders.length; i++) {
      const err = validateSimpleFolder(folder.folders[i], `${path}.folders[${i}]`)
      if (err) return err
    }
  }
  return null
}

export function validateWorkspaceJson(value: unknown): ValidateWorkspaceJsonResult {
  if (!isRecord(value)) {
    return { success: false, error: 'O JSON deve ser um objeto.' }
  }

  if (!('name' in value) || !isString(value.name) || (value.name as string).trim() === '') {
    return { success: false, error: 'O campo "name" é obrigatório e deve ser uma string não vazia.' }
  }

  if ('folders' in value && value.folders !== undefined) {
    if (!isArray(value.folders)) {
      return { success: false, error: 'O campo "folders" deve ser um array.' }
    }
    for (let i = 0; i < value.folders.length; i++) {
      const err = validateSimpleFolder(value.folders[i], `folders[${i}]`)
      if (err) return { success: false, error: err }
    }
  }

  if ('links' in value && value.links !== undefined) {
    if (!isArray(value.links)) {
      return { success: false, error: 'O campo "links" deve ser um array.' }
    }
    for (let i = 0; i < value.links.length; i++) {
      const l = value.links[i]
      if (!isRecord(l)) return { success: false, error: `links[${i}]: deve ser um objeto.` }
      if (!('title' in l) || !isString(l.title)) return { success: false, error: `links[${i}]: "title" é obrigatório.` }
      if (!('url' in l) || !isString(l.url)) return { success: false, error: `links[${i}]: "url" é obrigatório.` }
    }
  }

  const converted = convertSimpleToPayload(value as SimpleWorkspaceJson)
  return { success: true, data: converted }
}

export function convertSimpleToPayload(simple: SimpleWorkspaceJson): WorkspaceJsonPayload {
  const flatFolders: WorkspaceJsonFolder[] = []
  const flatLinks: WorkspaceJsonLink[] = []

  function processFolder(simpleFolder: SimpleFolder, parentId: string | null): void {
    const id = crypto.randomUUID()
    flatFolders.push({ id, name: simpleFolder.name.trim(), parentId })

    for (const link of simpleFolder.links ?? []) {
      flatLinks.push({
        id: crypto.randomUUID(),
        title: link.title.trim(),
        url: link.url.trim(),
        folderId: id
      })
    }
    for (const child of simpleFolder.folders ?? []) {
      processFolder(child, id)
    }
  }

  for (const folder of simple.folders ?? []) {
    processFolder(folder, null)
  }
  for (const link of simple.links ?? []) {
    flatLinks.push({
      id: crypto.randomUUID(),
      title: link.title.trim(),
      url: link.url.trim(),
      folderId: null
    })
  }

  return {
    name: simple.name.trim(),
    folders: flatFolders,
    links: flatLinks
  }
}
