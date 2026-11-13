import { describe, expect, it, vi } from 'vitest'
import { downloadJson } from '@/utils/download'

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

function stubDownloadEnv() {
  let captured: Blob | undefined
  const createObjectURL = vi.fn((blob: Blob) => {
    captured = blob
    return 'blob:mock-url'
  })
  const revokeObjectURL = vi.fn()
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {})
  return { createObjectURL, revokeObjectURL, click, getBlob: () => captured }
}

describe('downloadJson', () => {
  it('创建 blob URL 并在下载后释放', () => {
    const env = stubDownloadEnv()

    downloadJson('posts-2026-11-13.json', [{ id: '1', text: '你好' }])

    expect(env.createObjectURL).toHaveBeenCalledTimes(1)
    expect(env.getBlob()?.type).toBe('application/json')
    expect(env.click).toHaveBeenCalledTimes(1)
    expect(env.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('下载文件名与 href 指向生成的 blob URL', () => {
    const env = stubDownloadEnv()

    downloadJson('posts-2026-11-13.json', [])

    const anchor = env.click.mock.instances[0] as unknown as HTMLAnchorElement
    expect(anchor.download).toBe('posts-2026-11-13.json')
    expect(anchor.href).toBe('blob:mock-url')
  })

  it('JSON 内容为两空格缩进，便于人工阅读备份', async () => {
    const env = stubDownloadEnv()

    downloadJson('backup.json', [{ id: '1' }])

    await expect(readBlob(env.getBlob()!)).resolves.toBe(
      '[\n  {\n    "id": "1"\n  }\n]',
    )
  })
})
