import { describe, it, expect, vi, beforeEach } from 'vitest'
import { get, post, patch, del, postForm, patchForm, put } from './api'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
  localStorage.clear()
})

describe('get', () => {
  it('makes a GET request and returns JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'ok' }),
    })
    const result = await get('/test')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({ credentials: 'include' }),
    )
    expect(result).toEqual({ data: 'ok' })
  })
})

describe('post', () => {
  it('makes a POST request with JSON body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    })
    const result = await post('/test', { name: 'foo' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'foo' }),
      }),
    )
    expect(result).toEqual({ id: 1 })
  })
})

describe('patch', () => {
  it('makes a PATCH request with JSON body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ updated: true }),
    })
    const result = await patch('/test/1', { title: 'new' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test/1'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ title: 'new' }),
      }),
    )
    expect(result).toEqual({ updated: true })
  })
})

describe('del', () => {
  it('makes a DELETE request', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ deleted: true }),
    })
    const result = await del('/test/1')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test/1'),
      expect.objectContaining({ method: 'DELETE' }),
    )
    expect(result).toEqual({ deleted: true })
  })
})

describe('postForm', () => {
  it('makes a POST with FormData', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'img.jpg' }),
    })
    const form = new FormData()
    form.append('file', new Blob(['x']), 'x.jpg')
    const result = await postForm('/upload', form)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/upload'),
      expect.objectContaining({
        method: 'POST',
        body: form,
      }),
    )
    expect(result).toEqual({ url: 'img.jpg' })
  })
})

describe('patchForm', () => {
  it('makes a PATCH with FormData', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ updated: true }),
    })
    const form = new FormData()
    form.append('file', new Blob(['y']), 'y.jpg')
    const result = await patchForm('/test/1', form)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test/1'),
      expect.objectContaining({
        method: 'PATCH',
        body: form,
      }),
    )
    expect(result).toEqual({ updated: true })
  })
})

describe('put', () => {
  it('makes a PUT request with JSON body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ saved: true }),
    })
    const result = await put('/test/1', { key: 'val' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test/1'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ key: 'val' }),
      }),
    )
    expect(result).toEqual({ saved: true })
  })
})

describe('error handling', () => {
  it('throws on non-ok response with server message', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Bad request' }),
    })
    await expect(get('/bad')).rejects.toThrow('Bad request')
  })

  it('throws generic message when no error body', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('parse fail')),
    })
    await expect(get('/fail')).rejects.toThrow('Error de servidor')
  })
})

describe('auth token', () => {
  it('includes Authorization header when token exists', async () => {
    localStorage.setItem('token', 'my-jwt')
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
    await get('/secure')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/secure'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-jwt' }),
      }),
    )
  })

  it('does not include Authorization header without token', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
    await get('/public')
    const callHeaders = mockFetch.mock.calls[0][1].headers
    expect(callHeaders.Authorization).toBeUndefined()
  })
})
